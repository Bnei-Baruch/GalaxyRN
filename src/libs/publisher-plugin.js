import { STUN_SRV_GXY } from '@env';
import { RTCPeerConnection } from 'react-native-webrtc';
import logger from '../services/logger';
import { randomString } from '../shared/tools';
import { useInRoomStore } from '../zustand/inRoom';
import {
  addConnectionListener,
  removeConnectionListener,
  waitConnection,
} from './connection-monitor';

const NAMESPACE = 'PublisherPlugin';

export class PublisherPlugin {
  constructor(list = [{ urls: STUN_SRV_GXY }]) {
    this.id = randomString(12);
    this.janus = undefined;
    this.janusHandleId = undefined;
    this.pluginName = 'janus.plugin.videoroom';
    this.roomId = null;
    this.subTo = null;
    this.unsubFrom = null;
    this.talkEvent = null;
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
        useInRoomStore.getState().restartRoom();
      }
    });
  }

  getPluginName = () => {
    return this.pluginName;
  };

  transaction = (message, additionalFields, replyType) => {
    logger.debug(
      NAMESPACE,
      'transaction: ',
      message?.body,
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

  join = (roomId, user) => {
    this.roomId = roomId;
    const body = {
      request: 'join',
      room: roomId,
      ptype: 'publisher',
      display: JSON.stringify(user),
    };
    //const metadata = useUserStore.getState().user;
    return new Promise((resolve, reject) => {
      this.transaction('message', { body }, 'event')
        .then(param => {
          logger.info(NAMESPACE, 'join success');
          const { data, json } = param;

          if (data) resolve(data);
        })
        .catch(err => {
          logger.error(NAMESPACE, 'error join room', err);
          reject(err);
        });
    });
  };

  leave = () => {
    if (this.roomId) {
      const body = { request: 'leave', room: this.roomId };
      return new Promise((resolve, reject) => {
        this.transaction('message', { body }, 'event')
          .then(param => {
            logger.info(NAMESPACE, 'leave success');
            const { data, json } = param;

            if (data) resolve(data);
          })
          .catch(err => {
            logger.debug(NAMESPACE, 'error leave room', err);
            reject(err);
          });
      });
    }
  };

  publish = async stream => {
    if (!stream) {
      throw new Error('Stream is null or undefined');
    }
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    if (videoTracks.length > 0) {
      this.pc.addTrack(videoTracks[0], stream);
    }
    if (audioTracks.length > 0) {
      this.pc.addTrack(audioTracks[0], stream);
    }

    let videoTransceiver = null;
    let audioTransceiver = null;

    let tr = this.pc.getTransceivers();
    if (tr && tr.length > 0) {
      for (let t of tr) {
        if (t.sender && t.sender.track && t.sender.track.kind === 'video') {
          videoTransceiver = t;
          if (videoTransceiver.setDirection) {
            videoTransceiver.setDirection('sendonly');
          } else {
            videoTransceiver.direction = 'sendonly';
          }
          break;
        }
        if (t.sender && t.sender.track && t.sender.track.kind === 'audio') {
          audioTransceiver = t;
          if (audioTransceiver.setDirection) {
            audioTransceiver.setDirection('sendonly');
          } else {
            audioTransceiver.direction = 'sendonly';
          }
          break;
        }
      }
    }

    this.initPcEvents();

    await this.sdpActions();
    return true;
  };

  sdpActions = async () => {
    try {
      const offer = await this.pc.createOffer();
      logger.debug(NAMESPACE, 'Offer created', offer);

      await this.pc.setLocalDescription(offer);
      logger.debug(NAMESPACE, 'Local description set', offer);

      const sdp = offer.sdp.replace(
        /profile-level-id=[a-f0-9]{6}/g,
        'profile-level-id=42e01f'
      );
      const jsep = { type: offer.type, sdp };
      const body = { request: 'configure', video: true, audio: true };
      const result = await this.transaction('message', { body, jsep }, 'event');
      const { json, data } = result || {};
      if (json?.jsep) {
        await this.pc.setRemoteDescription(json.jsep);
      } else {
        logger.warn(NAMESPACE, 'No JSEP in response');
      }
      return data;
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to run sdpActions', error);
      throw error;
    }
  };

  mute = (video, stream) => {
    let videoTransceiver = null;
    let tr = this.pc.getTransceivers();
    if (tr && tr.length > 0) {
      for (let t of tr) {
        if (t?.sender?.track?.kind === 'video') {
          videoTransceiver = t;
          break;
        }
      }
    }

    let d = video ? 'inactive' : 'sendonly';

    if (videoTransceiver?.setDirection) {
      videoTransceiver.setDirection(d);
    } else {
      videoTransceiver.direction = d;
    }

    if (!video && stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTransceiver.sender.replaceTrack(videoTracks[0]);
      }
    }
    if (stream) this.configure();
  };

  setBitrate = bitrate => {
    const body = { request: 'configure', bitrate };
    return new Promise((resolve, reject) => {
      this.transaction('message', { body }, 'event')
        .then(param => {
          logger.info(NAMESPACE, 'set bitrate success');
          const { data, json } = param;

          if (data) resolve(data);
        })
        .catch(err => {
          logger.debug(NAMESPACE, 'error set bitrate', err);
          reject(err);
        });
    });
  };

  audio = stream => {
    let audioTransceiver = null;
    let tr = this.pc.getTransceivers();
    if (tr && tr.length > 0) {
      for (let t of tr) {
        if (t?.sender?.track?.kind === 'audio') {
          audioTransceiver = t;
          break;
        }
      }
    }

    if (audioTransceiver?.setDirection) {
      audioTransceiver.setDirection('sendonly');
    } else {
      audioTransceiver.direction = 'sendonly';
    }

    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTransceiver.sender.replaceTrack(audioTracks[0]);
      }
    }
    this.configure();
  };

  configure = async (restart = false) => {
    let offer = null;
    try {
      offer = await this.pc.createOffer({ iceRestart: restart });
      logger.debug(NAMESPACE, 'created offer', offer);
      await this.pc.setLocalDescription(offer);
      logger.debug(NAMESPACE, 'setLocalDescription: ', offer);
    } catch (error) {
      logger.error(NAMESPACE, 'setLocalDescription: ', error);
    }

    // Apply the same SDP modification as in sdpActions for consistency
    const modifiedSdp = offer.sdp.replace(
      /profile-level-id=[a-f0-9]{6}/g,
      'profile-level-id=42e01f'
    );
    const jsep = { type: offer.type, sdp: modifiedSdp };

    const message = {
      body: { request: 'configure', audio: true, video: true },
      jsep: jsep,
    };
    if (restart) {
      message.body.restart = true;
    }

    const param = await this.transaction('message', message, 'event');

    logger.debug(NAMESPACE, 'Configure respond');
    const { json } = param || {};
    if (json?.jsep) {
      try {
        await this.pc.setRemoteDescription(json.jsep);
        logger.debug(NAMESPACE, 'setRemoteDescription success');
      } catch (error) {
        logger.error(NAMESPACE, 'setRemoteDescription: ', error);
        throw new Error(`Failed to set remote description: ${error.message}`);
      }
    }
    logger.debug(NAMESPACE, 'Configure successful');
  };

  waitForStable = async (attempts = 0) => {
    if (attempts > 30) {
      throw new Error('Failed to wait for stable state');
    }
    if (!this.pc || this.pc.connectionState === 'closed') {
      throw new Error('PeerConnection not available');
    }

    if (this.pc.connectionState === 'failed') {
      throw new Error('PeerConnection failed');
    }
    if (this.pc.signalingState === 'stable') {
      return true;
    }

    return await this.waitForStable(attempts + 1);
  };

  iceRestart = async () => {
    logger.info(NAMESPACE, 'Starting ICE restart');

    if (this.iceRestartInProgress) {
      logger.warn(NAMESPACE, 'ICE restart already in progress, skipping');
      return;
    }

    const isConnected = await waitConnection();
    if (!isConnected) {
      return;
    }

    this.iceRestartInProgress = true;

    try {
      await this.waitForStable();
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to wait for stable state', error);
      this.iceRestartInProgress = false;
      useInRoomStore.getState().restartRoom();
      return;
    }

    try {
      logger.debug(NAMESPACE, 'Restarting ICE');
      await this.configure(true);
      this.iceRestartInProgress = false;
    } catch (error) {
      logger.error(NAMESPACE, 'ICE restart failed:', error);
      this.iceRestartInProgress = false;
      useInRoomStore.getState().restartRoom();
    }
  };

  initPcEvents = () => {
    this.pc.addEventListener('connectionstatechange', () => {
      if (this.isDestroyed) return;
      logger.info(
        NAMESPACE,
        'Connection state changed:',
        this.pc?.connectionState
      );
    });

    this.pc.addEventListener('iceconnectionstatechange', () => {
      if (this.isDestroyed) return;
      const iceState = this.pc?.iceConnectionState;
      const signalingState = this.pc?.signalingState;
      logger.info(
        NAMESPACE,
        'ICE connection state changed:',
        iceState,
        'Signaling state:',
        signalingState
      );
    });

    this.pc.addEventListener('signalingstatechange', () => {
      if (this.isDestroyed) return;
      logger.info(
        NAMESPACE,
        'Signaling state changed:',
        this.pc?.signalingState
      );
    });

    this.pc.addEventListener('icecandidate', e => {
      if (this.isDestroyed) return;
      logger.debug(NAMESPACE, 'ICE Candidate: ', e.candidate);

      try {
        let candidate = { completed: true };
        const _candidate = e.candidate;
        if (
          !_candidate ||
          _candidate.candidate.indexOf('endOfCandidates') > 0
        ) {
          logger.debug(NAMESPACE, 'End of candidates');
        } else {
          // JSON.stringify doesn't work on some WebRTC objects anymore
          // See https://code.google.com/p/chromium/issues/detail?id=467366
          candidate = {
            candidate: _candidate.candidate,
            sdpMid: _candidate.sdpMid,
            sdpMLineIndex: _candidate.sdpMLineIndex,
          };
        }

        if (candidate) {
          return this.transaction('trickle', { candidate });
        }
      } catch (e) {
        logger.error(NAMESPACE, 'ICE candidate error', e);
      }
    });
  };

  success = (janus, janusHandleId) => {
    this.janus = janus;
    this.janusHandleId = janusHandleId;

    return this;
  };

  onmessage = data => {
    logger.debug(NAMESPACE, 'onmessage: ', data);
    if (data?.publishers) {
      logger.info(NAMESPACE, 'New feed enter: ', data.publishers[0]);
      this.subTo(data.publishers);
    }

    if (data?.unpublished) {
      logger.info(NAMESPACE, 'Feed leave: ', data.unpublished);
      if (data?.unpublished === 'ok') {
        // That's us
        this.janus
          .detach(this)
          .catch(err => logger.debug(NAMESPACE, 'Detach error:', err));
        return;
      }
      this.unsubFrom && this.unsubFrom([data.unpublished], false);
    }

    if (data?.leaving) {
      logger.info(NAMESPACE, 'Feed leave: ', data.leaving);
      this.unsubFrom && this.unsubFrom([data.leaving], false);
    }

    if (data?.videoroom === 'talking') {
      logger.debug(NAMESPACE, 'talking: ', data.id);
      this.talkEvent(data.id, true);
    }

    if (data?.videoroom === 'stopped-talking') {
      logger.debug(NAMESPACE, 'stopped talking: ', data.id);
      this.talkEvent(data.id, false);
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
    if (this.pc && !isReady) {
      useInRoomStore.getState().restartRoom();
    }
  };

  detach = () => {
    this.isDestroyed = true;

    if (this.pc) {
      this.pc.getTransceivers().forEach(transceiver => {
        if (transceiver) {
          this.pc.removeTrack(transceiver.sender);
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
    this.subTo = null;
    this.unsubFrom = null;
    this.talkEvent = null;
  };
}
