import { STUN_SRV_GXY } from '@env';
import { EventEmitter } from 'events';
import {
  MediaStream,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import logger from '../services/logger';
import { randomString, sleep } from '../shared/tools';
import { useInRoomStore } from '../zustand/inRoom';
import {
  addConnectionListener,
  removeConnectionListener,
} from './connection-monitor';

const NAMESPACE = 'StreamingPlugin';

export class StreamingPlugin extends EventEmitter {
  constructor(list = [{ urls: STUN_SRV_GXY }]) {
    super();
    this.id = randomString(12);
    this.janus = undefined;
    this.janusHandleId = undefined;
    this.streamId = null;
    this.candidates = [];
    this.onStatus = null;
    this.pluginName = 'janus.plugin.streaming';
    this.iceRestartInProgress = false;
    this.pc = new RTCPeerConnection({
      iceServers: list,
    });
    this.watch = this.watch.bind(this);
    this.transaction = this.transaction.bind(this);
    this.iceRestart = this.iceRestart.bind(this);

    addConnectionListener(NAMESPACE, () => {
      this.watch(this.streamId, true);
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
          const { json } = param;

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

  async sdpExchange(jsep) {
    logger.debug(NAMESPACE, 'sdpExchange: ', jsep);
    const sessionDescription = new RTCSessionDescription(jsep);
    await this.pc.setRemoteDescription(sessionDescription);
    const answer = await this.pc.createAnswer();
    answer.sdp = answer.sdp.replace(
      /a=fmtp:111 minptime=10;useinbandfec=1\r\n/g,
      'a=fmtp:111 minptime=10;useinbandfec=1;stereo=1;sprop-stereo=1\r\n'
    );
    await this.pc.setLocalDescription(answer);
    await this.start(answer);
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
    logger.info(NAMESPACE, 'Starting ICE restart for streaming');

    if (this.iceRestartInProgress) {
      logger.warn(NAMESPACE, 'ICE restart already in progress, skipping');
      return;
    }
    this.iceRestartInProgress = true;

    if (!this.streamId) {
      logger.warn(NAMESPACE, 'Cannot restart ICE - no stream ID available');
      useInRoomStore.getState().restartRoom();
      return;
    }

    try {
      await this.waitForStable();
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to wait for stable state:', error);
      useInRoomStore.getState().restartRoom();
      this.iceRestartInProgress = false;
      return;
    }

    try {
      this.pc.restartIce();

      const body = { request: 'watch', id: this.streamId, restart: true };
      const result = await this.transaction('message', { body }, 'event');

      logger.debug(NAMESPACE, 'ICE restart response: ', result);
      const { json } = result || {};

      if (json?.jsep) {
        this.sdpExchange(json.jsep);
        logger.info(NAMESPACE, 'ICE restart completed successfully');
      } else {
        logger.warn(NAMESPACE, 'ICE restart: No JSEP in response');
      }

      this.iceRestartInProgress = false;
      return result;
    } catch (error) {
      logger.error(NAMESPACE, 'ICE restart failed:', error);
      useInRoomStore.getState().restartRoom();
    }
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

  stop() {
    logger.debug(NAMESPACE, 'stop');
    const body = { request: 'stop' };
    return this.transaction('message', { body }, 'event')
      .then(({ data, json }) => {
        logger.debug(NAMESPACE, 'stop: ', data, json);
        return { data, json };
      })
      .catch(err => {
        logger.error(
          NAMESPACE,
          'StreamingJanusPlugin, cannot stop stream',
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

    this.pc.addEventListener('icecandidate', e => {
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

    this.pc.addEventListener('track', e => {
      logger.info(NAMESPACE, 'Got track: ', e);
      const stream = new MediaStream([e.track]);
      logger.debug(NAMESPACE, 'StreamingPlugin stream from track', stream);
      resolve(stream);
    });

    this.pc.addEventListener('iceconnectionstatechange', () => {
      const iceState = this.pc?.iceConnectionState;
      logger.info(NAMESPACE, 'ICE connection state changed:', iceState);
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
  }

  detach() {
    logger.debug(NAMESPACE, 'Detach called');
    if (this.janus) {
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      removeConnectionListener(NAMESPACE);
      this.removeAllListeners();

      // Store janus reference before clearing
      const janusRef = this.janus;

      // Clear additional properties
      this.janusHandleId = undefined;
      this.streamId = null;
      this.candidates = [];
      this.onStatus = null;
      this.janus = null;
    }
    return Promise.resolve();
  }
}
