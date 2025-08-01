import { STUN_SRV_GXY } from '@env';
import { EventEmitter } from 'events';
import { RTCPeerConnection } from 'react-native-webrtc';
import logger from '../services/logger';
import { randomString } from '../shared/tools';
import IceConnectionMonitor from './ice-connection-monitor';

const NAMESPACE = 'PublisherPlugin';

export class PublisherPlugin extends EventEmitter {
  constructor(list = [{ urls: STUN_SRV_GXY }]) {
    super();
    this.id = randomString(12);
    this.janus = undefined;
    this.janusHandleId = undefined;
    this.pluginName = 'janus.plugin.videoroom';
    this.roomId = null;
    this.subTo = null;
    this.unsubFrom = null;
    this.talkEvent = null;
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
    return this.janus.transaction(message, payload, replyType);
  }

  join(roomId, user) {
    this.roomId = roomId;
    const body = {
      request: 'join',
      room: roomId,
      ptype: 'publisher',
      display: JSON.stringify(user),
    };
    return new Promise((resolve, reject) => {
      this.transaction('message', { body }, 'event')
        .then(param => {
          logger.info(NAMESPACE, 'join: ', param);
          const { data, json } = param;

          if (data) resolve(data);
        })
        .catch(err => {
          logger.error(NAMESPACE, 'error join room', err);
          reject(err);
        });
    });
  }

  leave() {
    if (this.roomId) {
      const body = { request: 'leave', room: this.roomId };
      return new Promise((resolve, reject) => {
        this.transaction('message', { body }, 'event')
          .then(param => {
            logger.info(NAMESPACE, 'leave: ', param);
            const { data, json } = param;

            if (data) resolve(data);
          })
          .catch(err => {
            logger.debug(NAMESPACE, 'error leave room', err);
            reject(err);
          });
      });
    }
  }

  publish(stream) {
    return new Promise((resolve, reject) => {
      if (!stream) {
        reject(new Error('Stream is null or undefined'));
        return;
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

      this.pc.createOffer().then(offer => {
        this.pc.setLocalDescription(offer);
        const sdp = offer.sdp.replace(
          /profile-level-id=[a-f0-9]{6}/g,
          'profile-level-id=42e01f'
        );

        const jsep = { type: offer.type, sdp };
        const body = { request: 'configure', video: true, audio: true };
        return this.transaction('message', { body, jsep }, 'event')
          .then(param => {
            const { data, json } = param || {};
            const jsep = json.jsep;
            logger.debug(NAMESPACE, 'Configure respond: ', param);
            resolve(data);
            this.pc.setRemoteDescription(jsep);
          })
          .catch(error => reject(error));
      });
    });
  }

  mute(video, stream) {
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
  }

  setBitrate(bitrate) {
    const body = { request: 'configure', bitrate };
    return new Promise((resolve, reject) => {
      this.transaction('message', { body }, 'event')
        .then(param => {
          logger.info(NAMESPACE, 'set bitrate: ', param);
          const { data, json } = param;

          if (data) resolve(data);
        })
        .catch(err => {
          logger.debug(NAMESPACE, 'error set bitrate', err);
          reject(err);
        });
    });
  }

  audio(stream) {
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
  }

  async configure(restart) {
    const offer = await this.pc.createOffer();
    logger.debug(NAMESPACE, 'createOffer: ', offer);
    this.pc
      .setLocalDescription(offer)
      .catch(error => logger.error(NAMESPACE, 'setLocalDescription: ', error));
    const body = { request: 'configure', restart };
    return this.transaction('message', { body, jsep: offer }, 'event').then(
      param => {
        logger.debug(NAMESPACE, 'Configure respond: ', param);
        const { data, json } = param || {};
        const jsep = json.jsep;
        this.pc
          .setRemoteDescription(jsep)
          .then(e => logger.info(NAMESPACE, e))
          .catch(e => logger.error(NAMESPACE, e));
      }
    );
  }

  initPcEvents() {
    this.iceConnectionMonitor = new IceConnectionMonitor(
      this.pc,
      this.iceFailed,
      this.janus,
      () => this.configure(true),
      'publisher'
    );
    this.iceConnectionMonitor.init();

    this.pc.addEventListener('connectionstatechange', () => {
      logger.info(
        NAMESPACE,
        'Connection state changed:',
        this.pc?.connectionState
      );
    });

    this.pc.addEventListener('iceconnectionstatechange', () => {
      logger.info(
        NAMESPACE,
        'ICE connection state changed:',
        this.pc?.iceConnectionState
      );
    });

    this.pc.addEventListener('signalingstatechange', () => {
      logger.info(
        NAMESPACE,
        'Signaling state changed:',
        this.pc?.signalingState
      );
    });

    this.pc.addEventListener('icecandidate', e => {
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
  }

  success(janus, janusHandleId) {
    this.janus = janus;
    this.janusHandleId = janusHandleId;

    return this;
  }

  error(cause) {
    // Couldn't attach to the plugin
  }

  onmessage(data) {
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
    if (this.pc && !isReady) this.iceFailed();
  }

  detach() {
    if (this.pc) {
      this.pc.getTransceivers().forEach(transceiver => {
        if (transceiver) {
          this.pc.removeTrack(transceiver.sender);
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
    this.iceState = null;
    this.iceFailed = null;
    this.subTo = null;
    this.unsubFrom = null;
    this.talkEvent = null;
  }
}
