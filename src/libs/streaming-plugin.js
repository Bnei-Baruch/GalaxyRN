import { STUN_SRV_GXY } from '@env';
import { EventEmitter } from 'events';
import { MediaStream, RTCPeerConnection } from 'react-native-webrtc';
import logger from '../services/logger';
import { randomString } from '../shared/tools';
import IceConnectionMonitor from './ice-connection-monitor';

const NAMESPACE = 'StreamingPlugin';

export class StreamingPlugin extends EventEmitter {
  constructor(list = [{ urls: STUN_SRV_GXY }]) {
    super();
    this.id = randomString(12);
    this.janus = undefined;
    this.janusHandleId = undefined;
    this.iceState = null;
    this.streamId = null;
    this.candidates = [];
    this.onStatus = null;
    this.pluginName = 'janus.plugin.streaming';
    this.pc = new RTCPeerConnection({
      iceServers: list,
    });
    this.watch = this.watch.bind(this);
    this.transaction = this.transaction.bind(this);
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
      logger.debug(NAMESPACE, 'janus transaction response: ', r);
      return r;
    });
  }

  watch(id, restart = false) {
    logger.info(NAMESPACE, 'watch: ', id, restart);
    this.streamId = id;
    const body = { request: 'watch', id, restart };
    return new Promise((resolve, reject) => {
      if (!this.janus) {
        logger.error(
          NAMESPACE,
          'Cannot watch stream - janus connection is not initialized'
        );
        return reject(new Error('Janus connection not initialized'));
      }

      this.transaction('message', { body }, 'event')
        .then(param => {
          logger.debug(NAMESPACE, 'message from watch: ', param);
          if (!param) {
            logger.error(NAMESPACE, 'Empty response from transaction');
            return reject(new Error('Empty transaction response'));
          }

          logger.debug(NAMESPACE, 'watch: ', param);
          const { session_id, json } = param;

          let audioTransceiver = null,
            videoTransceiver = null;
          let transceivers = this.pc.getTransceivers();
          if (transceivers && transceivers.length > 0) {
            for (let t of transceivers) {
              if (t?.receiver?.track?.kind === 'audio') {
                if (audioTransceiver?.setDirection) {
                  audioTransceiver.setDirection('recvonly');
                }
                continue;
              }
              if (t?.receiver?.track?.kind === 'video') {
                if (videoTransceiver?.setDirection) {
                  videoTransceiver.setDirection('recvonly');
                }
                continue;
              }
            }
          }

          if (json?.jsep) {
            logger.debug(NAMESPACE, 'sdp: ', json);
            try {
              this.sdpExchange(json.jsep);
            } catch (error) {
              logger.error(NAMESPACE, 'Error in SDP exchange', error);
              return reject(error);
            }
          } else if (!restart) {
            logger.warn(NAMESPACE, 'No JSEP received');
          }

          if (restart) return;

          this.initPcEvents(resolve);
        })
        .catch(err => {
          logger.error(NAMESPACE, 'Error watching stream', err);
          reject(err);
        });
    });
  }

  sdpExchange(jsep) {
    logger.debug(NAMESPACE, 'sdpExchange: ', jsep);
    this.pc.setRemoteDescription(jsep);
    this.pc.createAnswer().then(
      desc => {
        desc.sdp = desc.sdp.replace(
          /a=fmtp:111 minptime=10;useinbandfec=1\r\n/g,
          'a=fmtp:111 minptime=10;useinbandfec=1;stereo=1;sprop-stereo=1\r\n'
        );
        this.pc.setLocalDescription(desc);
        this.start(desc);
      },
      error => logger.error(NAMESPACE, 'SDP Exchange', error)
    );
  }

  start(jsep) {
    logger.debug(NAMESPACE, 'start: ', jsep);
    const body = { request: 'start' };
    const message = { body };
    if (jsep) {
      message.jsep = jsep;
    }

    return this.transaction('message', message, 'event')
      .then(({ data, json }) => {
        logger.debug(NAMESPACE, 'start: ', data, json);
        return { data, json };
      })
      .catch(err => {
        logger.error(
          NAMESPACE,
          'StreamingJanusPlugin, cannot start stream',
          err
        );
        throw err;
      });
  }

  switch(id) {
    logger.debug(NAMESPACE, 'switch: ', id);
    const body = { request: 'switch', id };
    return this.transaction('message', { body }, 'event')
      .then(({ data, json }) => {
        logger.debug(NAMESPACE, 'start: ', data, json);
        return { data, json };
      })
      .catch(err => {
        logger.error(
          NAMESPACE,
          'StreamingJanusPlugin, cannot start stream',
          err
        );
        throw err;
      });
  }

  initPcEvents(resolve) {
    logger.debug(NAMESPACE, 'initPcEvents');
    this.iceConnectionMonitor = new IceConnectionMonitor(
      this.pc,
      this.iceFailed,
      this.janus,
      () => this.watch(this.streamId, true),
      'streaming'
    );
    this.iceConnectionMonitor.init();

    this.pc.addEventListener('icecandidate', e => {
      logger.debug(NAMESPACE, 'ICE Candidate: ', e.candidate, this.iceState);
      return this.transaction('trickle', { candidate: e.candidate }).then(
        ({ data, json }) => {
          logger.debug(NAMESPACE, 'trickle: ', data, json);
          return { data, json };
        }
      );
    });

    this.pc.addEventListener('track', e => {
      logger.info(NAMESPACE, 'Got track: ', e);
      const stream = new MediaStream([e.track]);
      logger.debug(NAMESPACE, 'StreamingPlugin stream from track', stream);
      resolve(stream);
    });
  }

  success(janus, janusHandleId) {
    this.janus = janus;
    this.janusHandleId = janusHandleId;
    return this;
  }

  error(cause) {
    logger.error(NAMESPACE, 'Error in streaming plugin:', cause);
  }

  onmessage(data) {
    logger.debug(NAMESPACE, 'Received message:', data);
  }

  oncleanup() {
    logger.debug(NAMESPACE, 'Cleanup called');
  }

  detached() {
    logger.debug(NAMESPACE, 'Detached from plugin');
  }

  hangup() {
    logger.debug(NAMESPACE, 'Hangup called');
  }

  slowLink(uplink, lost, mid) {
    logger.warn(NAMESPACE, 'SlowLink detected:', {
      uplink,
      lost,
      mid,
    });
  }

  mediaState(media, on) {
    logger.debug(NAMESPACE, 'Media state changed:', {
      media,
      on,
    });
  }

  webrtcState(isReady) {
    logger.debug(NAMESPACE, 'WebRTC state changed:', {
      isReady,
    });
    if (this.pc && !isReady) {
      this.iceFailed();
    }
  }

  detach() {
    logger.debug(NAMESPACE, 'Detach called');
    if (this.janus) {
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      if (this.iceConnectionMonitor) {
        this.iceConnectionMonitor.remove();
        this.iceConnectionMonitor = null;
      }
      this.removeAllListeners();

      // Store janus reference before clearing
      const janusRef = this.janus;

      // Clear additional properties
      this.janusHandleId = undefined;
      this.iceState = null;
      this.streamId = null;
      this.candidates = [];
      this.onStatus = null;
      this.janus = null;
    }
    return Promise.resolve();
  }
}
