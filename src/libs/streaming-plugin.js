import { STUN_SRV_GXY } from '@env';
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

export class StreamingPlugin {
  constructor(list = [{ urls: STUN_SRV_GXY }]) {
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
    this.init = this.init.bind(this);
    this.transaction = this.transaction.bind(this);
    this.iceRestart = this.iceRestart.bind(this);
    this.mediaState = this.mediaState.bind(this);
    this.webrtcState = this.webrtcState.bind(this);

    this.initPcEvents();

    addConnectionListener(this.id, () => {
      try {
        logger.info(NAMESPACE, 'Connection listener called');
        this.iceRestart();
      } catch (error) {
        logger.error(NAMESPACE, 'Error in connection listener', error);
        useInRoomStore.getState().restartRoom();
      }
    });
  }

  getPluginName() {
    return this.pluginName;
  }

  initPcEvents() {
    logger.debug(NAMESPACE, 'initPcEvents');

    this.pc.addEventListener('track', e => {
      const { track } = e;
      logger.info(NAMESPACE, 'track: ', track);
      if (track.kind === 'audio' || track.kind === 'video') {
        const stream = new MediaStream([track]);
        this.onTrack(stream);
      }
    });

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

    this.pc.addEventListener('iceconnectionstatechange', () => {
      const iceState = this.pc?.iceConnectionState;
      logger.info(NAMESPACE, 'ICE connection state changed:', iceState);
    });
  }

  async transaction(message, additionalFields, replyType) {
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
      throw new Error('JanusPlugin is not connected');
    }

    return this.janus.transaction(message, payload, replyType);
  }

  async init(id) {
    logger.info(NAMESPACE, 'watch: ', id);
    this.streamId = id;
    const body = { request: 'watch', id };
    const result = await this.transaction('message', { body }, 'event');
    logger.debug(NAMESPACE, 'init: ', result);
    const { json } = result || {};
    if (!json?.jsep) {
      logger.error(NAMESPACE, 'No JSEP received');
      throw new Error('No JSEP received');
    }
    await this.sdpExchange(json.jsep);
  }

  async waitForStable(attempts = 0) {
    logger.debug(
      NAMESPACE,
      'waitForStable: ',
      this.pc?.connectionState,
      this.pc?.signalingState
    );
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
    logger.debug(NAMESPACE, 'waitForStable loop: ', this.pc?.connectionState);
    return this.waitForStable(attempts + 1);
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
      logger.debug(NAMESPACE, 'Restarting ICE');
      const body = { request: 'watch', id: this.streamId, restart: true };
      const result = await this.transaction('message', { body }, 'event');

      logger.debug(NAMESPACE, 'ICE restart response: ', result?.plugindata);
      const { json } = result || {};

      if (json?.jsep) {
        await this.sdpExchange(json.jsep);
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

  async start(jsep) {
    logger.debug(NAMESPACE, 'start: ', jsep);
    const body = { request: 'start' };
    const message = { body };
    if (jsep) {
      message.jsep = jsep;
    }
    let result = null;
    try {
      result = await this.transaction('message', message, 'event');
      logger.debug(NAMESPACE, 'start response: ', result);
    } catch (error) {
      logger.error(NAMESPACE, 'cannot start stream', error);
      useInRoomStore.getState().restartRoom();
    }

    return result;
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
        logger.error(NAMESPACE, 'cannot switch stream', err);
        throw err;
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
    //useInRoomStore.getState().restartRoom();
  }

  slowLink(uplink, lost, mid) {
    logger.warn(NAMESPACE, 'SlowLink detected:', {
      uplink,
      lost,
      mid,
    });
  }

  mediaState(media, on) {
    logger.info(
      NAMESPACE,
      `mediaState: Janus ${on ? 'start' : 'stop'} ${media}`
    );
  }

  webrtcState(isReady) {
    logger.info(
      NAMESPACE,
      `webrtcState: RTCPeerConnection is: ${isReady ? 'up' : 'down'}`
    );
  }

  detach() {
    logger.debug(NAMESPACE, 'Detach called');
    if (this.janus) {
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      removeConnectionListener(this.id);

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
