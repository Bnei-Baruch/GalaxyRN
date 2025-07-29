import { STUN_SRV_GXY } from '@env';
import { EventEmitter } from 'events';
import { RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import logger from '../services/logger';
import { randomString } from '../shared/tools';
import IceConnectionMonitor from './ice-connection-monitor';

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
    this.iceState = null;
    this.iceFailed = null;
    this.pc = new RTCPeerConnection({
      iceServers: list,
    });
    this.configure = this.configure.bind(this);
    this.iceConnectionMonitor = null;
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

  handleJsep(jsep) {
    const sessionDescription = new RTCSessionDescription(jsep);
    this.pc
      .setRemoteDescription(sessionDescription)
      .then(() => {
        return this.pc.createAnswer();
      })
      .then(answer => {
        logger.debug(NAMESPACE, 'Answer created', answer);
        this.pc
          .setLocalDescription(answer)
          .then(data => {
            logger.debug(NAMESPACE, 'setLocalDescription', data);
          })
          .catch(error => logger.error(NAMESPACE, error, answer));
        this.start(answer);
      })
      .catch(error => logger.error(NAMESPACE, error, jsep));
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
      this.iceConnectionMonitor = new IceConnectionMonitor(
        this.pc,
        this.iceFailed,
        this.janus,
        () => this.configure(),
        'subscriber'
      );
      this.iceConnectionMonitor.init();

      this.pc.addEventListener('icecandidate', e => {
        logger.debug(NAMESPACE, 'onicecandidate set', e.candidate);
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
    }
  }

  success(janus, janusHandleId) {
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
    if (this.pc && !isReady && typeof this.iceFailed === 'function') {
      this.iceFailed();
    }
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

      this.pc.close();
      this.removeAllListeners();
      this.pc = null;
      this.janus = null;
    }

    if (this.iceConnectionMonitor) {
      this.iceConnectionMonitor.remove();
      this.iceConnectionMonitor = null;
    }

    // Clear additional properties
    this.janusHandleId = undefined;
    this.roomId = null;
    this.onTrack = null;
    this.onUpdate = null;
    this.iceState = null;
    this.iceFailed = null;
  }
}
