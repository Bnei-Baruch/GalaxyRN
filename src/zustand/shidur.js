import { create } from 'zustand';
import {
  VIDEO_240P_OPTION_VALUE,
  NO_VIDEO_OPTION_VALUE,
  audiog_options2,
  trllang,
  NOTRL_STREAM_ID,
} from '../shared/consts';
import JanusStream from './streaming-utils';
import { useUserStore } from './user';
import { useSettingsStore } from './settings';
import RNSecureStorage from 'rn-secure-storage';
import GxyJanus from '../shared/janus-utils';
import { JanusMqtt } from '../libs/janus-mqtt';
import log from 'loglevel';
import { StreamingPlugin } from '../libs/streaming-plugin';

let janus = null;

let videoQuadStream = null;

// Streaming plugin for video.
let videoJanus  = null;
let videoStream = null;

// Streaming plugin for audio.
let audioJanus  = null;
let audioStream = null;

// Streaing plugin for trlAudio
let trlAudioJanus  = null;
let trlAudioStream = null;

let mixvolume = null;
let config    = null;

const initStream = async (_janus, media) => {
  const janusStream    = new StreamingPlugin(config?.iceServers);
  janusStream.onStatus = () => {
    if (_janus) initStream(_janus, media);
  };
  const _data          = await _janus.attach(janusStream);
  log.debug('[shidur] attach media', _data);
  const stream = await janusStream.watch(media);
  return [stream, janusStream];
};

/*
const initQuadStream = (callback) => {
  this.initJanus(null, () => {
    this.videoQuadStream          = new StreamingPlugin(this.config?.iceServers);
    this.videoQuadStream.onStatus = () => {
      if (this.janus) this.initQuadStream(callback);
    };
    this.janus.attach(this.videoQuadStream).then((data) => {
      log.debug('[shidur] attach quad', data);
      this.videoQuadStream.watch(102).then((stream) => {
        callback(stream);
      });
    });
  });
};
*/
export const useShidurStore = create((set) => ({
  video   : VIDEO_240P_OPTION_VALUE,
  audio   : 64,
  videoUrl: null,
  quadUrl : null,
  ready   : false,
  talking : false,
  isPlay  : true,

  setVideo     : async (video) => {
    if (!janus) return;
    console.log('setVideo', video);
    if (video === NO_VIDEO_OPTION_VALUE) {
      if (videoJanus !== null) {
        janus.detach(videoJanus);
        videoJanus = null;
      }
    } else {
      if (videoJanus) {
        await videoJanus.switch(video);
      } else {
        await initStream(janus, video);
      }
    }
    set({ videoUrl: videoStream.toURL(), ready: true, video });
    setToStorage('vrt_video', video);
  },
  setAudio     : async (audio, text) => {
    if (useShidurStore.getState().talking) {
      const audio_option = audiog_options2.find((option) => option.value === audio);
      const id           = trllang[audio_option.eng_text];
      if (id) {
        await trlAudioJanus.switch(id);
      }
    } else {
      await audioJanus?.switch(audio);
    }
    console.log('setAudio', audio, text);
    setToStorage('vrt_lang', audio);
    if (audio !== NOTRL_STREAM_ID)
      setToStorage('trl_lang', audio);
    setToStorage('vrt_langtext', text);
    set({ videoUrl: videoStream.toURL(), ready: true, audio });
  },
  init         : async (srv) => {
    const { user }        = useUserStore.getState();
    const { isBroadcast } = useSettingsStore.getState();

    console.log('[shidur] init');
    const video = await getFromStorage('vrt_video', 1).then(x => Number(x));
    const audio = await getFromStorage('vrt_lang', 2).then(x => Number(x));

    console.log('[shidur] init', audio, video);
    set({ video, audio });

    if (!isBroadcast) return;

    if (janus) this.clean();

    let str = srv;
    if (!srv) {
      const gw_list = GxyJanus.gatewayNames('streaming');
      let inst      = gw_list[Math.floor(Math.random() * gw_list.length)];
      config        = GxyJanus.instanceConfig(inst);
      str           = config.name;
      console.log('[shidur] init build janus', inst, config);

    }
    janus = new JanusMqtt(user, str);

    janus.onStatus = (srv, status) => {
      if (status !== 'online') {
        log.warn('[shidur] janus status: ', status);
        if (this.janus) janus.destroy();
        janus = null;
        setTimeout(() => {
          useShidurStore.getState().init();
        }, 7000);
      }
    };

    janus.init(config.token).then(async data => {
      log.debug('[shidur] init janus ready ', data);

      const promises = [];
      if (!videoJanus && video !== NO_VIDEO_OPTION_VALUE) {
        promises.push(
          initStream(janus, video).then(res => {
            videoStream = res[0];
            videoJanus  = res[1];
            return true;
          })
        );
      }
      if (!audioJanus) {
        promises.push(
          initStream(janus, audio).then(res => {
            audioStream = res[0];
            audioJanus  = res[1];
            return true;
          })
        );
      }
      if (!trlAudioJanus) {
        const id = await getFromStorage('vrt_langtext', 301).then(x => Number(x));
        promises.push(
          initStream(janus, id).then(res => {
            trlAudioStream = res[0];
            trlAudioJanus  = res[1];
            return true;
          })
        );
      }
      console.log('[shidur] wait all', promises.length);
      //wait for ready all streams
      return Promise.all(promises);
    }).then(() => {
      console.log('[shidur] streams are ready', videoStream.toURL());
      set(() => ({ videoUrl: videoStream.toURL(), ready: true }));
    }).catch(err => {
      console.error('[shidur] stream error', err);
    });

  },
  clean        : () => {
    if (useShidurStore.getState().talking) {
      clearInterval(this.talking);
      this.talking = null;
    }
    if (!janus) return;
    stopStream(videoStream);
    videoJanus = null;
    stopStream(audioStream);
    audioJanus = null;
    stopStream(trlAudioStream);
    trlAudioJanus = null;
  },
  toggleTalking: () => {
    const _nextOnAir = !state.talking;
    JanusStream.streamGalaxy(_nextOnAir, 4, 'test');
    //JanusStream.audioMediaStream.enabled    = !_nextOnAir;
    //JanusStream.trlAudioJanusStream.enabled = _nextOnAir;
    set({ talking: _nextOnAir });
  },
  toggleIsPlay : () => set(state => {
    const isPlay = !state.isPlay;

    videoStream.getVideoTracks().forEach(t => t.enabled = isPlay);
    audioStream.getAudioTracks().forEach(t => t.enabled = isPlay);
    //stopStream(trlAudioStream);
    return { isPlay };
  })
}));

const stopStream = (stream) => {
  stream.getVideoTracks().forEach(t => t.stop());
  stream.getAudioTracks().forEach(t => t.stop());
  stream = null;
};

const getFromStorage = async (key, def) => {
  try {
    return await RNSecureStorage.getItem(key);
  } catch (err) {
    return def;
  }
};
const setToStorage   = async (key, val) => {
  try {
    console.log('setToStorage', key, val);
    return await RNSecureStorage.setItem(key, val.toString());
  } catch (err) {
    console.error('RNSecureStorage setToStorage error', err);
    return err;
  }
};