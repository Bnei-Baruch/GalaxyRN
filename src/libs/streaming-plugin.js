import { STUN_SRV_GXY } from '@env';
import {
  MediaStream,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import logger from '../services/logger';
import { randomString } from '../shared/tools';
import { useShidurStore } from '../zustand/shidur';
import {
  addConnectionListener,
  removeConnectionListener,
} from './connection-monitor';
import { CONNECTION } from './sentry/constants';
import { addSpan, finishSpan } from './sentry/sentryHelper';

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
    this.isDestroyed = false;
    this.pc = new RTCPeerConnection({
      iceServers: list,
    });

    this.initPcEvents();

    addConnectionListener(this.id, async () => {
      const connectionListenerSpan = addSpan(
        CONNECTION,
        'streaming.connectionListener',
        {
          streamId: this.streamId,
          handleId: this.janusHandleId,
          iceConnectionState: this.pc?.iceConnectionState,
        }
      );
      try {
        logger.info(NAMESPACE, 'Connection listener called');
        await this.iceRestart();
        finishSpan(connectionListenerSpan, 'ok');
      } catch (error) {
        logger.error(NAMESPACE, 'Error in connection listener', error);
        finishSpan(connectionListenerSpan, 'internal_error');
        useShidurStore.getState().restartShidur();
      }
    });
  }

  getPluginName = () => {
    return this.pluginName;
  };

  initPcEvents = () => {
    logger.debug(NAMESPACE, 'initPcEvents');

    this.pc.addEventListener('track', e => {
      if (this.isDestroyed) return;
      const { track } = e;
      const trackSpan = addSpan(CONNECTION, 'streaming.track', {
        trackKind: track?.kind,
        trackId: track?.id,
      });
      logger.info(NAMESPACE, 'track: ', track);
      if (track.kind === 'audio' || track.kind === 'video') {
        const stream = new MediaStream([track]);
        this.onTrack(stream);
        finishSpan(trackSpan, 'ok');
      } else {
        finishSpan(trackSpan, 'ok');
      }
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

    this.pc.addEventListener('iceconnectionstatechange', () => {
      if (this.isDestroyed) return;
      const iceState = this.pc?.iceConnectionState;
      const iceStateSpan = addSpan(CONNECTION, 'streaming.iceState').finishSpan(
        iceStateSpan,
        status
      );
    });
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
      throw new Error('JanusPlugin is not connected');
    }

    return this.janus.transaction(message, payload, replyType);
  };

  init = async id => {
    const initSpan = addSpan(CONNECTION, 'streaming.init', {
      streamId: id,
      handleId: this.janusHandleId,
    });
    logger.info(NAMESPACE, 'watch: ', id);
    this.streamId = id;
    const body = { request: 'watch', id };

    try {
      const result = await this.transaction('message', { body }, 'event');
      logger.debug(NAMESPACE, 'init successful');
      const { json } = result || {};
      if (!json?.jsep) {
        logger.error(NAMESPACE, 'No JSEP received');
        finishSpan(initSpan, 'internal_error');
        throw new Error('No JSEP received');
      }
      await this.sdpExchange(json.jsep);
      finishSpan(initSpan, 'ok');
    } catch (error) {
      const errorCode = error?.data?.error_code;

      if (errorCode === 455) {
        logger.error(
          NAMESPACE,
          `Stream ${id} not found on Janus server (error 455)`
        );
        finishSpan(initSpan, 'internal_error');
        throw new Error(`Stream ${id} not found on Janus server`);
      }

      finishSpan(initSpan, 'internal_error');
      throw error;
    }
  };

  iceRestart = async () => {
    const iceRestartSpan = addSpan(CONNECTION, 'streaming.iceRestart');
    logger.info(NAMESPACE, 'Starting ICE restart for streaming');

    if (this.iceRestartInProgress) {
      logger.warn(NAMESPACE, 'ICE restart already in progress, skipping');
      finishSpan(iceRestartSpan, 'duplicate');
      return;
    }
    this.iceRestartInProgress = true;

    if (!this.streamId) {
      logger.warn(NAMESPACE, 'Cannot restart ICE - no stream ID available');
      this.iceRestartInProgress = false;
      finishSpan(iceRestartSpan, 'no_stream_id');
      useShidurStore.getState().restartShidur();
      return;
    }

    try {
      logger.debug(NAMESPACE, 'Restarting ICE');
      const body = { request: 'watch', id: this.streamId, restart: true };
      const result = await this.transaction('message', { body }, 'event');

      logger.debug(NAMESPACE, 'ICE restart successful');
      const { json } = result || {};

      if (json?.jsep) {
        await this.sdpExchange(json.jsep);
        logger.info(NAMESPACE, 'ICE restart completed successfully');
        finishSpan(iceRestartSpan, 'ok');
      } else {
        logger.warn(NAMESPACE, 'ICE restart: No JSEP in response');
        finishSpan(iceRestartSpan, 'no_jsep');
      }

      this.iceRestartInProgress = false;
      return result;
    } catch (error) {
      this.iceRestartInProgress = false;
      const errorCode = error?.data?.error_code;

      // Handle "No such mountpoint/stream" error (455)
      if (errorCode === 455) {
        logger.error(
          NAMESPACE,
          `Stream ${this.streamId} not found during ICE restart (error 455)`
        );
        finishSpan(iceRestartSpan, 'bad_response');
        useShidurStore.getState().restartShidur();
        return;
      }

      // Handle "Already in room" or similar Janus errors (460, 436, etc.)
      if (errorCode === 460 || errorCode === 436) {
        logger.warn(NAMESPACE, `Janus error ${errorCode}, skipping restart`);
        finishSpan(iceRestartSpan, 'janus_error');
        return;
      }

      logger.error(NAMESPACE, 'ICE restart failed:', error);
      finishSpan(iceRestartSpan, 'error_response');
      useShidurStore.getState().restartShidur();
    }
  };

  sdpExchange = async jsep => {
    logger.debug(NAMESPACE, 'sdpExchange: ', jsep);
    try {
      const sessionDescription = new RTCSessionDescription(jsep);
      await this.pc.setRemoteDescription(sessionDescription);
      const answer = await this.pc.createAnswer();
      answer.sdp = answer.sdp.replace(
        /a=fmtp:111 minptime=10;useinbandfec=1\r\n/g,
        'a=fmtp:111 minptime=10;useinbandfec=1;stereo=1;sprop-stereo=1\r\n'
      );
      await this.pc.setLocalDescription(answer);
      await this.start(answer);
    } catch (error) {
      logger.error(NAMESPACE, 'SDP exchange error:', error);
      throw error;
    }
  };

  start = async jsep => {
    logger.debug(NAMESPACE, 'start: ', jsep);
    const body = { request: 'start' };
    const message = { body };
    if (jsep) {
      message.jsep = jsep;
    }
    let result = null;
    try {
      result = await this.transaction('message', message, 'event');
      logger.debug(NAMESPACE, 'start successful');
    } catch (error) {
      logger.error(NAMESPACE, 'cannot start stream', error);
      useShidurStore.getState().restartShidur();
    }

    return result;
  };

  stop = () => {
    logger.debug(NAMESPACE, 'stop');
    const body = { request: 'stop' };
    return this.transaction('message', { body }, 'event').catch(err => {
      logger.error(NAMESPACE, 'StreamingJanusPlugin, cannot stop stream', err);
      throw err;
    });
  };

  switch = id => {
    logger.debug(NAMESPACE, 'switch: ', id);
    const body = { request: 'switch', id };
    return this.transaction('message', { body }, 'event').catch(err => {
      const errorCode = err?.data?.error_code;
      logger.error(
        NAMESPACE,
        `cannot switch stream to ${id}, error code: ${errorCode}`,
        err
      );

      // Handle "No such mountpoint/stream" error (455)
      if (errorCode === 455) {
        logger.warn(
          NAMESPACE,
          `Stream ${id} not found on Janus server, skipping switch`
        );
        // Don't throw, just log the error
        return Promise.resolve({ error: 'Stream not found', code: 455 });
      }

      throw err;
    });
  };

  success = (janus, janusHandleId) => {
    this.janus = janus;
    this.janusHandleId = janusHandleId;
    return this;
  };

  error = cause => {
    logger.error(NAMESPACE, 'Error in streaming plugin:', cause);
  };

  onmessage = data => {
    logger.debug(NAMESPACE, 'Received message:', data);
  };

  oncleanup = () => {
    logger.debug(NAMESPACE, 'Cleanup called');
  };

  detached = () => {
    logger.debug(NAMESPACE, 'Detached from plugin');
  };

  hangup = () => {
    addSpan(CONNECTION, 'streaming.hangup', {
      destroyed: this.isDestroyed,
    }).finishSpan('ok');
    logger.debug(NAMESPACE, 'Hangup called');
  };

  slowLink = (uplink, lost, mid) => {
    addSpan(CONNECTION, 'streaming.slowLink', {
      uplink,
      lost,
      mid,
      streamId: this.streamId,
      handleId: this.janusHandleId,
      iceConnectionState: this.pc?.iceConnectionState,
    }).finishSpan('ok');
    logger.warn(NAMESPACE, 'SlowLink detected:', {
      uplink,
      lost,
      mid,
    });
  };

  mediaState = (media, on) => {
    addSpan(CONNECTION, 'streaming.mediaState', { media, on }).finishSpan('ok');

    logger.info(NAMESPACE, `mediaState: Janus ${on} ${media}`);
  };

  webrtcState = isReady => {
    addSpan(CONNECTION, 'streaming.webrtcState', { isReady }).finishSpan('ok');

    logger.info(NAMESPACE, `webrtcState: RTCPeerConnection is: ${isReady}`);
  };

  detach = () => {
    addSpan(CONNECTION, 'streaming.detach').finishSpan('ok');
    logger.debug(NAMESPACE, 'Detach called');
    this.isDestroyed = true;

    if (this.janus) {
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      removeConnectionListener(this.id);
      this.janusHandleId = undefined;
      this.streamId = null;
      this.candidates = [];
      this.onStatus = null;
      this.janus = null;
    }
    finishSpan(detachSpan, 'ok');
    return Promise.resolve();
  };
}
