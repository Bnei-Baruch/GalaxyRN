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
import {
  addFinishSpan,
  addSpan,
  finishSpan,
  setSpanAttributes,
} from './sentry/sentryHelper';

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
          NAMESPACE,
        }
      );
      try {
        logger.info(NAMESPACE, 'Connection listener called');
        await this.iceRestart();
        finishSpan(connectionListenerSpan, 'ok', NAMESPACE);
      } catch (error) {
        logger.error(NAMESPACE, 'Error in connection listener', error);
        finishSpan(connectionListenerSpan, 'internal_error', NAMESPACE);
        this.detach();
        useShidurStore.getState().restartShidur();
      }
    });
    logger.debug(
      NAMESPACE,
      'StreamingPlugin constructor done',
      this.id,
      this.janusHandleId,
      this.streamId
    );
  }

  getPluginName = () => {
    return this.pluginName;
  };

  initPcEvents = () => {
    logger.debug(NAMESPACE, 'initPcEvents');

    this.pc.addEventListener('track', e => {
      if (this.isDestroyed) return;
      const { track } = e;
      logger.info(NAMESPACE, 'track: ', track);
      if (track.kind === 'audio' || track.kind === 'video') {
        const stream = new MediaStream([track]);
        this.onTrack(stream);
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
      addFinishSpan(CONNECTION, 'streaming.iceState', { iceState, NAMESPACE });
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

    if (
      !this.pc ||
      this.pc.connectionState === 'closed' ||
      this.pc.signalingState === 'closed'
    ) {
      throw new Error('PeerConnection is closed');
    }

    return this.janus.transaction(message, payload, replyType);
  };

  init = async id => {
    const initSpan = addSpan(CONNECTION, 'streaming.init', {
      streamId: id,
      handleId: this.janusHandleId,
      NAMESPACE,
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
        finishSpan(initSpan, 'internal_error', NAMESPACE);
        throw new Error('No JSEP received');
      }
      await this.sdpExchange(json.jsep);
      finishSpan(initSpan, 'ok', NAMESPACE);
    } catch (error) {
      const errorCode = error?.data?.error_code;

      if (errorCode === 455) {
        logger.error(
          NAMESPACE,
          `Stream ${id} not found on Janus server (error 455)`
        );
        finishSpan(initSpan, 'internal_error', NAMESPACE);
        throw new Error(`Stream ${id} not found on Janus server`);
      }

      finishSpan(initSpan, 'internal_error', NAMESPACE);
      throw error;
    }
  };

  iceRestart = async () => {
    const iceRestartSpan = addSpan(CONNECTION, 'streaming.iceRestart', {
      NAMESPACE,
    });
    logger.info(NAMESPACE, 'Starting ICE restart for streaming');

    if (this.isDestroyed) {
      return;
    }
    if (!this.streamId) {
      logger.warn(NAMESPACE, 'Cannot restart ICE - no stream ID available');
      finishSpan(iceRestartSpan, 'no_stream_id', NAMESPACE);

      this.detach();
      useShidurStore.getState().restartShidur();
      return;
    }
    const iceState = this.pc.iceConnectionState;

    if (iceState === 'closed') {
      finishSpan(iceRestartSpan, 'ice_connection_closed', NAMESPACE);
      this.detach();
      useShidurStore.getState().restartShidur();
      return;
    }

    //TODO: Comment this when we have a way to detect janus connection state
    /*
    if (iceState !== 'failed' && iceState !== 'disconnected') {
      logger.warn(NAMESPACE, 'connection is not failed or disconnected');
      finishSpan(iceRestartSpan, 'connection_not_failed_or_disconnected', NAMESPACE);
      return;
    }
    */

    try {
      logger.debug(NAMESPACE, 'Restarting ICE');
      const body = { request: 'watch', id: this.streamId, restart: true };
      const result = await this.transaction('message', { body }, 'event');

      logger.debug(NAMESPACE, 'ICE restart successful');
      const { json } = result || {};

      if (json?.jsep) {
        await this.sdpExchange(json.jsep);
        logger.info(NAMESPACE, 'ICE restart completed successfully');
        finishSpan(iceRestartSpan, 'ok', NAMESPACE);
      } else {
        logger.warn(NAMESPACE, 'ICE restart: No JSEP in response');
        finishSpan(iceRestartSpan, 'no_jsep', NAMESPACE);
      }

      return result;
    } catch (error) {
      const errorCode = error?.data?.error_code;
      // Handle "Already in room" or similar Janus errors (460, 436, etc.)
      if (errorCode === 460 || errorCode === 436) {
        setSpanAttributes(iceRestartSpan, { errorCode, NAMESPACE });
        finishSpan(iceRestartSpan, 'already_in_room_error', NAMESPACE);
        return;
      }

      setSpanAttributes(iceRestartSpan, { error, NAMESPACE });
      finishSpan(iceRestartSpan, 'error_response', NAMESPACE);
      this.detach();
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
      this.detach();
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

  hangup = reason => {
    addFinishSpan(CONNECTION, 'streaming.hangup', {
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
    useShidurStore.getState().restartShidur();
  };

  slowLink = (uplink, lost, mid) => {
    addFinishSpan(CONNECTION, 'streaming.slowLink', {
      uplink,
      lost,
      mid,
      streamId: this.streamId,
      handleId: this.janusHandleId,
      iceConnectionState: this.pc?.iceConnectionState,
      NAMESPACE,
    });
    logger.warn(NAMESPACE, 'SlowLink detected:', {
      uplink,
      lost,
      mid,
    });
  };

  mediaState = (media, on) => {
    addFinishSpan(CONNECTION, 'streaming.mediaState', { media, on, NAMESPACE });
  };

  detach = () => {
    if (this.isDestroyed) {
      return;
    }

    const detachSpan = addSpan(CONNECTION, 'streaming.detach', { NAMESPACE });
    logger.debug(NAMESPACE, 'Detach called');
    this.isDestroyed = true;

    if (this.pc) {
      try {
        this.pc.getTransceivers().forEach(transceiver => {
          if (transceiver) {
            if (transceiver.receiver && transceiver.receiver.track)
              transceiver.receiver.track.stop();
            transceiver.stop();
          }
        });
        this.pc.close();
        this.pc = null;
      } catch (error) {
        logger.error(NAMESPACE, 'Error in detach', error);
        setSpanAttributes(detachSpan, { error, NAMESPACE });
      }
    }

    removeConnectionListener(this.id);
    this.janusHandleId = undefined;
    this.streamId = null;
    this.candidates = [];
    this.onStatus = null;
    this.janus = null;
    finishSpan(detachSpan, 'ok', NAMESPACE);
  };
}
