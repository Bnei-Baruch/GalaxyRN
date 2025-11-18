import { STUN_SRV_GXY } from '@env';
import { RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import logger from '../services/logger';
import { randomString } from '../shared/tools';
import { useFeedsStore } from '../zustand/feeds';
import {
  addConnectionListener,
  removeConnectionListener,
} from './connection-monitor';
import { CONNECTION } from './sentry/constants';
import { addFinishSpan, addSpan, finishSpan } from './sentry/sentryHelper';

const NAMESPACE = 'SubscriberPlugin';

export class SubscriberPlugin {
  constructor(list = [{ urls: STUN_SRV_GXY }]) {
    this.id = randomString(12);
    this.janus = undefined;
    this.janusHandleId = undefined;
    this.pluginName = 'janus.plugin.videoroom';
    this.roomId = null;
    this.onTrack = null;
    this.onUpdate = null;
    this.isDestroyed = false;
    this.pc = new RTCPeerConnection({
      iceServers: list,
    });

    addConnectionListener(this.id, async () => {
      try {
        logger.info(NAMESPACE, 'Connection listener called');
        await this.iceRestart();
      } catch (error) {
        logger.error(NAMESPACE, 'Error in connection listener', error);
        this.detach();
        useFeedsStore.getState().restartFeeds();
      }
    });
  }

  getPluginName = () => {
    return this.pluginName;
  };

  transaction = async (message, additionalFields, replyType) => {
    logger.debug(
      NAMESPACE,
      'transaction: ',
      message,
      additionalFields,
      replyType
    );

    const payload = Object.assign({}, additionalFields, {
      handle_id: this.janusHandleId,
    });

    if (!this.janus) {
      return Promise.reject(new Error('JanusPlugin is not connected'));
    }

    if (
      !this.pc ||
      this.pc.connectionState === 'closed' ||
      this.pc.signalingState === 'closed'
    ) {
      throw new Error('PeerConnection is not connected');
    }

    return this.janus.transaction(message, payload, replyType);
  };

  sub = async subscription => {
    logger.debug(NAMESPACE, 'sub: ', subscription);
    const body = { request: 'subscribe', streams: subscription };
    try {
      const param = await this.transaction('message', { body }, 'event');
      logger.info(NAMESPACE, 'Subscribed successfully');
      const { data, json } = param || {};

      if (data?.videoroom === 'updated') {
        logger.info(NAMESPACE, 'Streams updated: ', data.streams);
        this.onUpdate && this.onUpdate(data.streams);
      }

      if (json?.jsep) {
        logger.debug(NAMESPACE, 'Got jsep: ', json.jsep);
        await this.handleJsep(json.jsep);
      }

      return data;
    } catch (error) {
      const errorCode = error?.data?.error_code;
      if (errorCode === 428 || errorCode === 424) {
        logger.warn(
          NAMESPACE,
          `Subscribe error ${errorCode}: `,
          JSON.stringify(error.data)
        );
        return;
      }
      logger.error(NAMESPACE, 'Subscribe to: ', error);
    }
  };

  unsub = async streams => {
    logger.info(NAMESPACE, 'Unsubscribe from streams: ', streams);
    try {
      const body = { request: 'unsubscribe', streams };
      const param = await this.transaction('message', { body }, 'event');
      logger.info(NAMESPACE, 'Unsubscribe successful');
      const { data, json } = param;

      if (data?.videoroom === 'updated') {
        logger.info(NAMESPACE, 'Streams updated: ', data.streams);
        this.onUpdate && this.onUpdate(data.streams);
      }

      if (json?.jsep) {
        logger.debug(NAMESPACE, 'Got jsep: ', json.jsep);
        await this.handleJsep(json.jsep);
      }

      return data;
    } catch (error) {
      logger.error(NAMESPACE, 'Unsubscribe from: ', error);
    }
  };

  join = (subscription, roomId) => {
    this.roomId = roomId;
    const body = {
      request: 'join',
      use_msid: true,
      room: roomId,
      ptype: 'subscriber',
      streams: subscription,
    };
    logger.debug(NAMESPACE, 'join: ', body);
    return new Promise((resolve, reject) => {
      this.transaction('message', { body }, 'event')
        .then(param => {
          logger.debug(NAMESPACE, 'joined successfully');
          const { data, json } = param;

          if (data) {
            resolve(data);
            this.initPcEvents();
          }

          if (json?.jsep) {
            logger.debug(NAMESPACE, 'Got jsep: ', json.jsep);
            this.handleJsep(json.jsep);
          }
        })
        .catch(err => {
          logger.error(NAMESPACE, 'join: ', err);
          reject(err);
        });
    });
  };

  configure = async () => {
    logger.info(NAMESPACE, 'Subscriber plugin configure');
    const body = { request: 'configure', restart: true };
    let param = null;
    try {
      param = await this.transaction('message', { body }, 'event');
      logger.info(NAMESPACE, 'configure successful');
    } catch (error) {
      logger.error(NAMESPACE, 'configure failed', error);
    }
    const { json } = param;
    if (json?.jsep) {
      logger.debug(NAMESPACE, 'Got jsep: ', json.jsep);
      this.handleJsep(json.jsep);
    }
    return param;
  };

  iceRestart = async () => {
    logger.info(NAMESPACE, 'Starting ICE restart');

    if (this.isDestroyed) {
      return;
    }
    const iceRestartSpan = addSpan(CONNECTION, 'subscriber.iceRestart', {
      NAMESPACE,
    });

    const iceState = this.pc.iceConnectionState;

    if (iceState === 'closed') {
      finishSpan(iceRestartSpan, 'ice_connection_closed');
      this.detach();
      useFeedsStore.getState().restartFeeds();
      return;
    }

    if (iceState !== 'failed' && iceState !== 'disconnected') {
      logger.warn(NAMESPACE, 'connection is not failed or disconnected');
      finishSpan(iceRestartSpan, 'connection_not_failed_or_disconnected');
      return;
    }

    if (
      useFeedsStore.getState().feedIds.filter(id => id !== 'my').length === 0
    ) {
      logger.debug(NAMESPACE, 'No publishers in the room, skipping');
      return;
    }

    try {
      await this.configure();
      logger.info(NAMESPACE, 'ICE restart completed successfully');
    } catch (error) {
      // Handle "Already in room" or similar Janus errors (460, 436, 424, etc.)
      const errorCode = error?.data?.error_code;
      if (errorCode === 460 || errorCode === 436 || errorCode === 424) {
        addAttributes(iceRestartSpan, { errorCode });
        finishSpan(iceRestartSpan, 'already_in_room_error');
        return;
      }

      addAttributes(iceRestartSpan, { error });
      finishSpan(iceRestartSpan, 'error_response');
      this.detach();
      useFeedsStore.getState().restartFeeds();
    }
  };

  handleJsep = async jsep => {
    logger.debug(NAMESPACE, 'handleJsep', jsep);
    const sessionDescription = new RTCSessionDescription(jsep);
    try {
      await this.pc.setRemoteDescription(sessionDescription);
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to set remote description', error);
      return;
    }
    try {
      const answer = await this.pc.createAnswer();
      const localDescription = await this.pc.setLocalDescription(answer);
      logger.debug(NAMESPACE, 'set answer', localDescription);
      await this.start(answer);
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to set answer', error);
      return;
    }
  };

  start = async jsep => {
    logger.debug(NAMESPACE, 'start', jsep);
    const body = { request: 'start', room: this.roomId };
    try {
      await this.transaction('message', { body, jsep }, 'event');
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to start', error);
    }
  };

  fetchParticipants = async () => {
    try {
      logger.info(NAMESPACE, 'listparticipants run', this.roomId);
      const body = { request: 'listparticipants', room: this.roomId };
      const param = await this.transaction('message', { body }, 'event');
      logger.info(NAMESPACE, 'listparticipants successful');
      return param?.data?.participants || [];
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to list participants', error);
      return [];
    }
  };

  initPcEvents = () => {
    logger.debug(NAMESPACE, 'initPcEvents');
    this.pc.addEventListener('icecandidate', e => {
      if (this.isDestroyed) return;
      logger.debug(NAMESPACE, 'ICE Candidate: ', e.candidate);
      let candidate = { completed: true };
      if (
        !e.candidate ||
        e.candidate.candidate.indexOf('endOfCandidates') > 0
      ) {
        logger.debug(NAMESPACE, 'End of candidates');
      } else {
        // JSON.stringify doesn't work on some WebRTC objects anymore
        // See https://code.google.com/p/chromium/issues/detail?id=467366
        candidate = {
          candidate: e.candidate.candidate,
          sdpMid: e.candidate.sdpMid,
          sdpMLineIndex: e.candidate.sdpMLineIndex,
        };
      }
      if (candidate) {
        return this.transaction('trickle', { candidate });
      }
    });

    this.pc.addEventListener('track', e => {
      if (this.isDestroyed) return;
      if (!e.streams[0]) return;

      this.onTrack && this.onTrack(e.track, e.streams[0], true);
    });

    this.pc.addEventListener('signalingstatechange', () => {
      if (this.isDestroyed) return;
      const signalingState = this.pc?.signalingState;
      logger.info(NAMESPACE, 'Signaling state changed:', signalingState);
    });

    this.pc.addEventListener('connectionstatechange', () => {
      if (this.isDestroyed) return;
      const connectionState = this.pc?.connectionState;
      logger.info(NAMESPACE, 'Connection state changed:', connectionState);
    });
    this.pc.addEventListener('iceconnectionstatechange', () => {
      if (this.isDestroyed) return;
      const iceState = this.pc?.iceConnectionState;
      logger.info(NAMESPACE, 'ICE connection state changed:', iceState);
    });
  };

  success = (janus, janusHandleId) => {
    logger.debug(NAMESPACE, 'Subscriber plugin success', janusHandleId);
    this.janus = janus;
    this.janusHandleId = janusHandleId;

    return this;
  };

  error = cause => {
    addFinishSpan(CONNECTION, 'subscriber.error', { cause, NAMESPACE });
    if (!this.isDestroyed) {
      this.detach();
      useFeedsStore.getState().restartFeeds();
    }
  };

  onmessage = (data, json) => {
    logger.info(NAMESPACE, 'onmessage: ', data, json);
    if (data?.videoroom === 'updated') {
      logger.info(NAMESPACE, 'Streams updated: ', data.streams);
      this.onUpdate && this.onUpdate(data.streams);
    }

    if (json?.jsep) {
      logger.debug(NAMESPACE, 'Handle jsep: ', json.jsep);
      this.handleJsep(json.jsep);
    }
  };

  // PeerConnection with the plugin closed, clean the UI
  // The plugin handle is still valid so we can create a new one
  oncleanup = () => {
    addFinishSpan(CONNECTION, 'subscriber.oncleanup', {
      isDestroyed: this.isDestroyed,
    });
  };

  // Connection with the plugin closed, get rid of its features
  // The plugin handle is not valid anymore
  detached = () => {
    addFinishSpan(CONNECTION, 'subscriber.detached', { NAMESPACE });
  };

  iceFailed = () => {
    addFinishSpan(CONNECTION, 'subscriber.iceFailed', { NAMESPACE });
  };

  hangup = reason => {
    addFinishSpan(CONNECTION, 'subscriber.hangup', {
      reason,
      isDestroyed: this.isDestroyed,
      NAMESPACE,
    });

    if (this.isDestroyed) {
      return;
    }
    this.detach();
    if (reason === 'Janus API') {
      return;
    }
    useFeedsStore.getState().restartFeeds();
  };

  slowLink = (uplink, lost, mid) => {
    addFinishSpan(CONNECTION, 'subscriber.slowLink', {
      uplink,
      lost,
      mid,
      NAMESPACE,
    });
  };

  mediaState = (media, on) => {
    logger.info(
      NAMESPACE,
      `mediaState: Janus ${on ? 'start' : 'stop'} receiving our ${media}`
    );
  };

  detach = () => {
    if (this.isDestroyed) {
      return;
    }

    addFinishSpan(CONNECTION, 'subscriber.detach', { NAMESPACE });
    this.isDestroyed = true;

    if (this.pc) {
      this.pc.getTransceivers().forEach(transceiver => {
        if (transceiver) {
          if (transceiver.receiver && transceiver.receiver.track)
            transceiver.receiver.track.stop();
          transceiver.stop();
        }
      });
      removeConnectionListener(this.id);
      this.pc.close();
      this.pc = null;
      this.janus = null;
    }

    // Clear additional properties
    this.janusHandleId = undefined;
    this.roomId = null;
    this.onTrack = null;
    this.onUpdate = null;
  };
}
