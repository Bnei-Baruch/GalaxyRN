import { randomString } from '../shared/tools';
import { EventEmitter } from 'events';
import log from 'loglevel';
import mqtt from '../shared/mqtt';
import { MediaStream, RTCPeerConnection } from 'react-native-webrtc';
import { STUN_SRV_GXY } from '@env';
import BackgroundTimer from 'react-native-background-timer';

export class StreamingPlugin extends EventEmitter {
  constructor(list = [{ urls: STUN_SRV_GXY }]) {
    super();
    this.id            = randomString(12);
    this.janus         = undefined;
    this.janusHandleId = undefined;
    this.iceState      = null;
    this.streamId      = null;
    this.candidates    = [];
    this.onStatus      = null;
    this.pluginName    = 'janus.plugin.streaming';
    this.pc            = new RTCPeerConnection({
      iceServers: list,
    });
  }

  getPluginName() {
    return this.pluginName;
  }

  transaction(message, additionalFields, replyType) {
    const payload = Object.assign({}, additionalFields,
      { handle_id: this.janusHandleId });

    if (!this.janus) {
      return Promise.reject(
        new Error('[streaming] JanusPlugin is not connected'));
    }

    return this.janus.transaction(message, payload, replyType);
  }

  watch(id, restart = false) {
    log.info('STUN SERVER', STUN_SRV_GXY);
    this.streamId = id;
    const body    = { request: 'watch', id, restart };
    return new Promise((resolve, reject) => {
      if (!this.janus) {
        log.error('[streaming] Cannot watch stream - janus connection is not initialized');
        return reject(new Error('Janus connection not initialized'));
      }
      
      this.transaction('message', { body }, 'event').then((param) => {
        if (!param) {
          log.error('[streaming] Empty response from transaction');
          return reject(new Error('Empty transaction response'));
        }
        
        log.debug('[streaming] watch: ', param);
        const { session_id, json } = param;

        let audioTransceiver = null, videoTransceiver = null;
        let transceivers     = this.pc.getTransceivers();
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
          log.debug('[streaming] sdp: ', json);
          try {
            this.sdpExchange(json.jsep);
          } catch (error) {
            log.error('[streaming] Error in SDP exchange', error);
            return reject(error);
          }
        } else if (!restart) {
          log.warn('[streaming] No JSEP received');
        }

        if (restart) return;

        this.initPcEvents(resolve);

      }).catch((err) => {
        log.error('[streaming] StreamingJanusPlugin, cannot watch stream', err?.message || JSON.stringify(err) || 'undefined');
        reject(err || new Error('Unknown streaming error'));
      });
    });
  }

  sdpExchange(jsep) {
    this.pc.setRemoteDescription(jsep);
    this.pc.createAnswer().then((desc) => {
      desc.sdp = desc.sdp.replace(/a=fmtp:111 minptime=10;useinbandfec=1\r\n/g,
        'a=fmtp:111 minptime=10;useinbandfec=1;stereo=1;sprop-stereo=1\r\n');
      this.pc.setLocalDescription(desc);
      this.start(desc);
    }, error => log.error('[streaming] SDP Exchange', error));
  }

  start(jsep) {
    const body    = { request: 'start' };
    const message = { body };
    if (jsep) {
      message.jsep = jsep;
    }

    return this.transaction('message', message, 'event').then(({ data, json }) => {
      return { data, json };
    }).catch((err) => {
      log.error('[streaming] StreamingJanusPlugin, cannot start stream', err);
      throw err;
    });
  }

  switch(id) {
    const body = { request: 'switch', id };

    return this.transaction('message', { body }, 'event').catch((err) => {
      log.error('[streaming] StreamingJanusPlugin, cannot start stream', err);
      throw err;
    });
  }

  getVolume(mid, result) {
    let transceiver = this.pc.getTransceivers().find(t => t.receiver.track.kind === 'audio');
    transceiver.receiver.getStats().then(stats => {
      stats.forEach(res => {
        if (!res || res.kind !== 'audio')
          return;
        result(res.audioLevel ? res.audioLevel : 0);
      });
    });
  }

  initPcEvents(resolve) {
    this.pc.addEventListener('connectionstatechange', (e) => {
      
      log.info('[streaming] ICE State: ', e.target.connectionState);
      this.iceState = e.target.connectionState;
      if (this.iceState === 'disconnected') {
        this.iceRestart();
      }

      // ICE restart does not help here, peer connection will be down
      if (this.iceState === 'failed') {
        this.onStatus(this.iceState);
      }
    });
    this.pc.addEventListener('icecandidate', (e) => {
      return this.transaction('trickle', { candidate: e.candidate });
    });
    this.pc.addEventListener('track', (e) => {
      log.info('[streaming] Got track: ', e);
      let stream = new MediaStream([e.track]);
      resolve(stream);
    });
  }

  async iceRestart(attempt = 0) {
    try {
      BackgroundTimer.setTimeout(() => {
        if (attempt < 10 && this.iceState !== 'disconnected' ||
          !this.janus?.isConnected) {
          log.debug('[streaming] Current ice state:', this.iceState);
          return;
        } else if (mqtt.mq.connected) {
          log.debug('[streaming] - Trigger ICE Restart - ');
          this.watch(this.streamId, true).catch(err => {
            log.error('[streaming] Error during ICE restart', err?.message || JSON.stringify(err) || 'undefined');
          });
        } else if (attempt >= 10) {
          log.error('[streaming] - ICE Restart failed - ');
          return;
        }
        log.debug('[streaming] ICE Restart try: ' + attempt);
        return this.iceRestart(attempt + 1);
      }, 1000);
    } catch (e) {
      console.error('[streaming] Error in iceRestart', e?.message || JSON.stringify(e) || 'undefined');
    }
  }

  success(janus, janusHandleId) {
    this.janus = janus;
    this.janusHandleId = janusHandleId;

    return this;
  }

  error(cause) {
    // Couldn't attach to the plugin
    log.error('[streaming] Plugin error:', cause?.message || JSON.stringify(cause) || 'undefined');
  }

  onmessage(data) {
    log.info('[streaming] onmessage: ', data);
  }

  oncleanup() {
    // PeerConnection with the plugin closed, clean the UI
    // The plugin handle is still valid so we can create a new one
  }

  detached() {
    // Connection with the plugin closed, get rid of its features
    // The plugin handle is not valid anymore
  }

  hangup() {
    //this.emit('hangup')
  }

  slowLink(uplink, lost, mid) {
    const direction = uplink ? 'sending' : 'receiving';
    log.info(
      '[streaming] slowLink on ' + direction + ' packets on mid ' + mid + ' (' +
      lost + ' lost packets)');
    //this.emit('slowlink')
  }

  mediaState(media, on) {
    log.info('[streaming] mediaState: Janus ' + (on ? 'start' : 'stop') +
      ' receiving our ' + media);
    //this.emit('mediaState', medium, on)
  }

  webrtcState(isReady) {
    log.info('[streaming] webrtcState: RTCPeerConnection is: ' +
      (isReady ? 'up' : 'down'));
    //this.emit('webrtcState', isReady, cause)
  }

  detach() {
    this.pc.close();
    this.removeAllListeners();
    this.janus = null;
  }
}
