import { STUN_SRV_GXY } from '@env';
import { RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import logger from '../services/logger';
import { randomString } from '../shared/tools';
import { useFeedsStore } from '../zustand/feeds';

import {
  addConnectionListener,
  removeConnectionListener,
  waitConnection,
} from './connection-monitor';

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
    this.iceRestartInProgress = false;
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
      if (error?.data?.error_code === 428) {
        logger.warn(NAMESPACE, 'Subscribe to: ', JSON.stringify(error.data));
        return;
      }
      logger.error(NAMESPACE, 'Subscribe to: ', JSON.stringify(error));
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

    if (this.iceRestartInProgress) {
      logger.warn(NAMESPACE, 'ICE restart already in progress, skipping');
      return;
    }

    if (
      useFeedsStore.getState().feedIds.filter(id => id !== 'my').length === 0
    ) {
      logger.debug(NAMESPACE, 'No publishers in the room, skipping');
      return;
    }
    this.iceRestartInProgress = true;

    const isConnected = await waitConnection();
    if (!isConnected || !this.pc || this.pc.connectionState === 'closed') {
      logger.error(NAMESPACE, 'peer connection closed');
      this.iceRestartInProgress = false;
      useFeedsStore.getState().restartFeeds();
      return;
    }

    try {
      await this.configure();
      logger.info(NAMESPACE, 'ICE restart completed successfully');
    } catch (error) {
      // Handle "Already in room" or similar Janus errors (460, 436, etc.)
      const errorCode = error?.data?.error_code;
      if (errorCode === 460 || errorCode === 436) {
        logger.warn(NAMESPACE, `Janus error ${errorCode}, skipping restart`);
        return;
      }

      logger.error(NAMESPACE, 'ICE restart failed:', error);
      useFeedsStore.getState().restartFeeds();
    } finally {
      this.iceRestartInProgress = false;
    }
  };

  handleJsep = async jsep => {
    logger.debug(NAMESPACE, 'handleJsep', jsep);
    const sessionDescription = new RTCSessionDescription(jsep);
    try {
      await this.pc.setRemoteDescription(sessionDescription);
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to set remote description', error);
    }
    try {
      const answer = await this.pc.createAnswer();
      const localDescription = await this.pc.setLocalDescription(answer);
      logger.debug(NAMESPACE, 'set answer', localDescription);
      await this.start(answer);
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to set answer', error);
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
    logger.error(NAMESPACE, 'plugin error', cause);
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

  oncleanup = () => {
    logger.info(NAMESPACE, '- oncleanup - ');
    // PeerConnection with the plugin closed, clean the UI
    // The plugin handle is still valid so we can create a new one
  };

  detached = () => {
    logger.info(NAMESPACE, '- detached - ');
    // Connection with the plugin closed, get rid of its features
    // The plugin handle is not valid anymore
  };

  hangup = () => {
    logger.info(NAMESPACE, '- hangup - ', this.janus);
    //this.detach();
  };

  slowLink = (uplink, lost, mid) => {
    const direction = uplink ? 'sending' : 'receiving';
    logger.info(
      NAMESPACE,
      `slowLink on ${direction} packets on mid ${mid} (${lost} lost packets)`
    );
    //this.emit('slowlink')
  };

  mediaState = (media, on) => {
    logger.info(
      NAMESPACE,
      `mediaState: Janus ${on ? 'start' : 'stop'} receiving our ${media}`
    );
  };

  webrtcState = isReady => {
    logger.info(
      NAMESPACE,
      `webrtcState: RTCPeerConnection is: ${isReady ? 'up' : 'down'}`
    );
  };

  detach = () => {
    logger.debug(NAMESPACE, 'detach');
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
