import { STUN_SRV_GXY } from '@env';
import { EventEmitter } from 'events';
import { RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import logger from '../services/logger';
import { randomString, sleep } from '../shared/tools';
import { useInRoomStore } from '../zustand/inRoom';
import {
  addConnectionListener,
  removeConnectionListener,
} from './connection-monitor';

const NAMESPACE = 'SubscriberPlugin';

export class SubscriberPlugin extends EventEmitter {
  constructor(list = [{ urls: STUN_SRV_GXY }]) {
    super();
    this.id = randomString(12);
    this.janus = undefined;
    this.janusHandleId = undefined;
    this.pluginName = 'janus.plugin.videoroom';
    this.roomId = null;
    this.onTrack = null;
    this.onUpdate = null;
    this.iceRestartInProgress = false;
    this.pc = new RTCPeerConnection({
      iceServers: list,
    });
    this.configure = this.configure.bind(this);
    this.transaction = this.transaction.bind(this);
    this.iceRestart = this.iceRestart.bind(this);

    addConnectionListener(NAMESPACE, () => {
      this.iceRestart();
    });
  }

  getPluginName() {
    return this.pluginName;
  }

  transaction(message, additionalFields, replyType) {
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

    logger.debug(NAMESPACE, 'transaction janus: ', Object.keys(this.janus));
    if (!this.janus) {
      return Promise.reject(new Error('JanusPlugin is not connected'));
    }
    return this.janus.transaction(message, payload, replyType).then(r => {
      logger.debug(
        NAMESPACE,
        'janus transaction response: ',
        r,
        this.janus.sessionId
      );
      return r;
    });
  }

  async sub(subscription) {
    logger.debug(NAMESPACE, 'sub: ', subscription);
    const body = { request: 'subscribe', streams: subscription };
    return new Promise((resolve, reject) => {
      logger.debug(NAMESPACE, 'sub: ', body);
      this.transaction('message', { body }, 'event')
        .then(param => {
          logger.info(NAMESPACE, 'Subscribe to: ', param);
          const { data, json } = param;

          if (data?.videoroom === 'updated') {
            logger.info(NAMESPACE, 'Streams updated: ', data.streams);
            this.onUpdate && this.onUpdate(data.streams);
          }

          if (json?.jsep) {
            logger.debug(NAMESPACE, 'Got jsep: ', json.jsep);
            this.handleJsep(json.jsep);
          }

          resolve(data);
        })
        .catch(err => {
          logger.error(NAMESPACE, 'Subscribe to: ', err);
          reject(err);
        });
    });
  }

  async unsub(streams) {
    logger.info(NAMESPACE, 'Unsubscribe from streams: ', streams);
    const body = { request: 'unsubscribe', streams };
    return new Promise((resolve, reject) => {
      this.transaction('message', { body }, 'event')
        .then(param => {
          logger.info(NAMESPACE, 'Unsubscribe from: ', param);
          const { data, json } = param;

          if (data?.videoroom === 'updated') {
            logger.info(NAMESPACE, 'Streams updated: ', data.streams);
            this.onUpdate && this.onUpdate(data.streams);
          }

          if (json?.jsep) {
            logger.debug(NAMESPACE, 'Got jsep: ', json.jsep);
            this.handleJsep(json.jsep);
          }

          resolve(data);
        })
        .catch(err => {
          logger.error(NAMESPACE, 'Unsubscribe from: ', err);
          reject(err);
        });
    });
  }

  join(subscription, roomId) {
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
          logger.debug(NAMESPACE, 'joined: ', param);
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
  }

  configure() {
    logger.info(NAMESPACE, 'Subscriber plugin configure');
    const body = { request: 'configure', restart: true };
    return this.transaction('message', { body }, 'event')
      .then(param => {
        logger.info(NAMESPACE, 'configure: ', param);
        const { json } = param || {};
        if (json?.jsep) {
          logger.debug(NAMESPACE, 'Got jsep: ', json.jsep);
          this.handleJsep(json.jsep);
        }
      })
      .catch(err => {
        logger.error(NAMESPACE, 'Subscriber plugin configure', err);
      });
  }

  async waitForStable(attempts = 0) {
    if (attempts > 30) {
      throw new Error('Failed to wait for stable state');
    }
    if (!this.pc || this.pc.connectionState === 'closed') {
      throw new Error('PeerConnection not available');
    }
    if (this.pc.signalingState === 'stable') {
      return true;
    }
    await sleep(100);
    return await this.waitForStable(attempts + 1);
  }

  async iceRestart() {
    logger.info(NAMESPACE, 'Starting ICE restart');
    if (this.iceRestartInProgress) {
      logger.warn(NAMESPACE, 'ICE restart already in progress, skipping');
      return;
    }
    this.iceRestartInProgress = true;

    try {
      await this.waitForStable();
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to wait for stable state:', error);
      useInRoomStore.getState().restartRoom();
      this.iceRestartInProgress = false;
      return;
    }

    this.pc.restartIce();

    try {
      const body = { request: 'configure', restart: true };
      const result = await this.transaction('message', { body }, 'event');

      logger.debug(NAMESPACE, 'ICE restart response: ', result);
      const { json } = result || {};

      if (json?.jsep) {
        this.handleJsep(json.jsep);
      }
      this.iceRestartInProgress = false;
    } catch (error) {
      logger.error(NAMESPACE, 'ICE restart failed:', error);
      useInRoomStore.getState().restartRoom();
      this.iceRestartInProgress = false;
    }
  }

  async handleJsep(jsep) {
    logger.debug(NAMESPACE, 'handleJsep', jsep);
    const sessionDescription = new RTCSessionDescription(jsep);
    try {
      await this.pc.setRemoteDescription(sessionDescription);
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to set remote description', error);
    }
    let answer;
    try {
      answer = await this.pc.createAnswer();
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to create answer', error);
    }
    logger.debug(NAMESPACE, 'Answer created', answer);
    try {
      const localDescription = await this.pc.setLocalDescription(answer);
      logger.debug(NAMESPACE, 'Local description set', localDescription);
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to set local description', error);
    }
    this.start(answer);
  }

  start(answer) {
    const body = { request: 'start', room: this.roomId };
    return new Promise((resolve, reject) => {
      const jsep = answer;
      this.transaction('message', { body, jsep }, 'event')
        .then(param => {
          const { data, json } = param || {};
          logger.info(NAMESPACE, 'start: ', param);
          resolve();
        })
        .catch(err => {
          logger.error(NAMESPACE, 'start', err, jsep);
          reject(err);
        });
    });
  }

  initPcEvents() {
    logger.debug(NAMESPACE, 'initPcEvents');
    if (this.pc) {
      this.pc.addEventListener('icecandidate', e => {
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
        if (!e.streams[0]) return;

        this.onTrack && this.onTrack(e.track, e.streams[0], true);
      });

      // Добавляем мониторинг signaling state
      this.pc.addEventListener('signalingstatechange', () => {
        const signalingState = this.pc?.signalingState;
        logger.info(NAMESPACE, 'Signaling state changed:', signalingState);
      });

      this.pc.addEventListener('connectionstatechange', () => {
        const connectionState = this.pc?.connectionState;
        logger.info(NAMESPACE, 'Connection state changed:', connectionState);
      });

      this.pc.addEventListener('iceconnectionstatechange', () => {
        const iceState = this.pc?.iceConnectionState;
        const signalingState = this.pc?.signalingState;
        logger.info(
          NAMESPACE,
          'ICE connection state changed:',
          iceState,
          'Signaling state:',
          signalingState
        );

        // Автоматический ICE restart при проблемах с соединением
        if (iceState === 'failed') {
          logger.warn(NAMESPACE, 'ICE connection failed, attempting restart');
          this.iceRestart().catch(error => {
            logger.error(NAMESPACE, 'ICE restart after failure failed:', error);
          });
        } else if (iceState === 'disconnected') {
          // Ждём немного перед рестартом, т.к. disconnected может быть временным
          setTimeout(() => {
            if (this.pc?.iceConnectionState === 'disconnected') {
              logger.warn(
                NAMESPACE,
                'ICE connection still disconnected, attempting restart'
              );
              this.iceRestart().catch(error => {
                logger.error(
                  NAMESPACE,
                  'ICE restart after disconnect failed:',
                  error
                );
              });
            }
          }, 5000); // 5 секунд задержки
        }
      });
    }
  }

  success(janus, janusHandleId) {
    logger.debug(NAMESPACE, 'Subscriber plugin success', janus, janusHandleId);
    this.janus = janus;
    this.janusHandleId = janusHandleId;

    return this;
  }

  error(cause) {
    logger.error(NAMESPACE, 'Subscriber plugin error', cause);
  }

  onmessage(data, json) {
    logger.info(NAMESPACE, 'onmessage: ', data, json);
    if (data?.videoroom === 'updated') {
      logger.info(NAMESPACE, 'Streams updated: ', data.streams);
      this.onUpdate && this.onUpdate(data.streams);
    }

    if (json?.jsep) {
      logger.debug(NAMESPACE, 'Handle jsep: ', json.jsep);
      this.handleJsep(json.jsep);
    }
  }

  oncleanup() {
    logger.info(NAMESPACE, '- oncleanup - ');
    // PeerConnection with the plugin closed, clean the UI
    // The plugin handle is still valid so we can create a new one
  }

  detached() {
    logger.info(NAMESPACE, '- detached - ');
    // Connection with the plugin closed, get rid of its features
    // The plugin handle is not valid anymore
  }

  hangup() {
    logger.info(NAMESPACE, '- hangup - ', this.janus);
    this.detach();
  }

  slowLink(uplink, lost, mid) {
    const direction = uplink ? 'sending' : 'receiving';
    logger.info(
      NAMESPACE,
      `slowLink on ${direction} packets on mid ${mid} (${lost} lost packets)`
    );
    //this.emit('slowlink')
  }

  mediaState(media, on) {
    logger.info(
      NAMESPACE,
      `mediaState: Janus ${on ? 'start' : 'stop'} receiving our ${media}`
    );
    //this.emit('mediaState', medium, on)
  }

  webrtcState(isReady) {
    logger.info(
      NAMESPACE,
      `webrtcState: RTCPeerConnection is: ${isReady ? 'up' : 'down'}`
    );
  }

  detach() {
    logger.debug(NAMESPACE, 'detach');
    if (this.pc) {
      this.pc.getTransceivers().forEach(transceiver => {
        if (transceiver) {
          if (transceiver.receiver && transceiver.receiver.track)
            transceiver.receiver.track.stop();
          transceiver.stop();
        }
      });
      removeConnectionListener(NAMESPACE);
      this.pc.close();
      this.removeAllListeners();
      this.pc = null;
      this.janus = null;
    }

    // Clear additional properties
    this.janusHandleId = undefined;
    this.roomId = null;
    this.onTrack = null;
    this.onUpdate = null;
  }
}
