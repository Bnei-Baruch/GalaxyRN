import { STUN_SRV_GXY } from '@env';
import { EventEmitter } from 'events';
import BackgroundTimer from 'react-native-background-timer';
import { MediaStream, RTCPeerConnection } from 'react-native-webrtc';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';
import { randomString } from '../shared/tools';

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
  }

  getPluginName() {
    return this.pluginName;
  }

  transaction(message, additionalFields, replyType) {
    const payload = Object.assign({}, additionalFields, {
      handle_id: this.janusHandleId,
    });

    if (!this.janus) {
      return Promise.reject(new Error('JanusPlugin is not connected'));
    }

    return this.janus.transaction(message, payload, replyType);
  }

  watch(id, restart = false) {
    logger.info(NAMESPACE, 'STUN SERVER', STUN_SRV_GXY);
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
    const body = { request: 'start' };
    const message = { body };
    if (jsep) {
      message.jsep = jsep;
    }

    return this.transaction('message', message, 'event')
      .then(({ data, json }) => {
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
    const body = { request: 'switch', id };

    return this.transaction('message', { body }, 'event').catch(err => {
      logger.error(NAMESPACE, 'StreamingJanusPlugin, cannot start stream', err);
      throw err;
    });
  }

  getVolume(mid, result) {
    let transceiver = this.pc
      .getTransceivers()
      .find(t => t.receiver.track.kind === 'audio');
    transceiver.receiver.getStats().then(stats => {
      stats.forEach(res => {
        if (!res || res.kind !== 'audio') return;
        result(res.audioLevel ? res.audioLevel : 0);
      });
    });
  }

  initPcEvents(resolve) {
    this.pc.addEventListener('connectionstatechange', e => {
      logger.info(NAMESPACE, 'ICE State: ', e.target.connectionState);
      this.iceState = e.target.connectionState;
      if (this.iceState === 'disconnected') {
        this.iceRestart();
      }

      // ICE restart does not help here, peer connection will be down
      if (this.iceState === 'failed') {
        this.onStatus(this.iceState);
      }
    });
    this.pc.addEventListener('icecandidate', e => {
      return this.transaction('trickle', { candidate: e.candidate });
    });
    this.pc.addEventListener('track', e => {
      logger.info(NAMESPACE, 'Got track: ', e);
      let stream = new MediaStream([e.track]);
      resolve(stream);
    });
  }

  async iceRestart(attempt = 0) {
    try {
      BackgroundTimer.setTimeout(() => {
        if (
          (attempt < 10 && this.iceState !== 'disconnected') ||
          !this.janus?.isConnected
        ) {
          logger.debug(NAMESPACE, 'Current ice state:', this.iceState);
          return;
        } else if (mqtt.mq.connected) {
          logger.debug(NAMESPACE, '- Trigger ICE Restart -');
          this.watch(this.streamId, true).catch(err => {
            logger.error(
              NAMESPACE,
              'Error during ICE restart',
              err?.message || JSON.stringify(err) || 'undefined'
            );
          });
        } else if (attempt >= 10) {
          logger.error(NAMESPACE, '- ICE Restart failed -');
          return;
        }
        logger.debug(NAMESPACE, `ICE Restart try: ${attempt}`);
        return this.iceRestart(attempt + 1);
      }, 1000);
    } catch (e) {
      logger.error(
        NAMESPACE,
        'Error in iceRestart',
        e?.message || JSON.stringify(e) || 'undefined'
      );
    }
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
  }

  detach() {
    if (this.janus) {
      this.pc.removeAllEventListeners();
      this.removeAllListeners();
      this.pc.close();
      return this.janus.detach(this);
    }
    return Promise.resolve();
  }
}
