import { create } from 'zustand';
import {
  VIDEO_240P_OPTION_VALUE,
  NO_VIDEO_OPTION_VALUE,
  audiog_options2,
  trllang,
  NOTRL_STREAM_ID,
  gxycol,
} from '../shared/consts';
import { useUserStore } from './user';
import { useSettingsStore } from './settings';
import GxyConfig from '../shared/janus-config';
import { JanusMqtt } from '../libs/janus-mqtt';
import log from 'loglevel';
import { StreamingPlugin } from '../libs/streaming-plugin';
import { getFromStorage, setToStorage } from '../shared/tools';
import { HIDE_BARS_TIMEOUT_MS } from './helper';

let janus = null;

let quadJanus  = null;
let quadStream = null;

// Streaming plugin for video.
let videoJanus  = null;
let videoStream = null;

// Streaming plugin for audio.
let audioJanus  = null;
let audioStream = null;

// Streaming plugin for trlAudio
let trlAudioJanus  = null;
let trlAudioStream = null;

let config = null;

let shidurBarTimeout;
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

const cleanStream = stream => stream?.getTracks().forEach(track => track.stop());

export const useShidurStore = create((set, get) => ({
  video          : VIDEO_240P_OPTION_VALUE,
  audio          : 64,
  videoStream    : null,
  quadUrl        : null,
  trlUrl         : null,
  audioUrl       : null,
  readyShidur    : false,
  talking        : null,
  isPlay         : false,
  janusReady     : false,
  isMuted        : false,
  setIsMuted     : (isMuted = !get().isMuted) => {
    audioStream?.getAudioTracks().forEach(t => t.enabled = !isMuted);
    set({ isMuted });
  },
  setVideo       : async (video, updateState = true) => {
    if (!janus) return;

    await setToStorage('vrt_video', video);
    if (video === NO_VIDEO_OPTION_VALUE) {
      if (videoJanus !== null) {
        cleanStream(videoStream);
        videoStream = null;
        videoJanus.detach();
        videoJanus = null;
      }
    } else {
      if (videoJanus) {
        await videoJanus.switch(video);
      } else {
        await get().initShidur();
      }
    }

    set({ videoStream, video });
  },
  setAudio       : async (audio, text) => {
    if (get().talking) {
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
    set({ videoStream, audio });
  },
  initJanus      : async (srv) => {
    const { user } = useUserStore.getState();
    if (janus)
      get().cleanShidur();

    let str = srv;
    if (!srv) {
      const gw_list = GxyConfig.gatewayNames('streaming');
      let inst      = gw_list[Math.floor(Math.random() * gw_list.length)];

      config = GxyConfig.instanceConfig(inst);
      str    = config.name;
      console.log('[shidur] init build janus', inst, config);
    }
    janus = new JanusMqtt(user, str);

    janus.onStatus = async (srv, status) => {
      if (status !== 'online') {
        log.warn('[shidur] janus status: ', status);
        if (janus)
          await get().cleanShidur();
        janus = null;
        setTimeout(() => {
          get().initJanus(srv);
        }, 7000);
      }
    };
    await janus.init(config.token);
    log.debug('[shidur] init janus ready');
    set({ janusReady: true });
  },
  cleanJanus     : async () => {
    if (!janus)
      return;

    get().cleanShidur();
    get().cleanQuads();
    await janus?.destroy();
    janus = null;
  },
  initShidur     : async (isPlay = get().isPlay) => {
    if (!useSettingsStore.getState().isShidur || !isPlay)
      return;

    const video = await getFromStorage('vrt_video', 1).then(x => Number(x));
    const audio = await getFromStorage('vrt_lang', 2).then(x => Number(x));

    set({ video, audio });

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
      const id = await getFromStorage('vrt_langtext', 'Original').then(x => trllang[x]);
      promises.push(
        initStream(janus, id).then(res => {
          trlAudioStream = res[0];
          trlAudioJanus  = res[1];
          return true;
        })
      );
    }
    console.log('[shidur] wait for ready all streams', promises.length);
    try {
      await Promise.all(promises);
      console.log('[shidur] streams are ready', videoStream);
      set(() => ({
        videoStream,
        audioUrl   : audioStream.toURL(),
        trlUrl     : trlAudioStream.toURL(),
        readyShidur: true
      }));
    } catch (err) {
      console.error('[shidur] stream error', err);
    }
  },
  cleanShidur    : () => {
    cleanStream(videoStream);
    videoStream = null;
    videoJanus?.detach();
    videoJanus = null;

    cleanStream(audioStream);
    audioStream = null;
    audioJanus?.detach();
    audioJanus = null;

    cleanStream(trlAudioStream);
    trlAudioStream = null;
    trlAudioJanus?.detach();
    trlAudioJanus = null;

    set({ readyShidur: false, videoStream: null, talking: null });
  },
  streamGalaxy   : async (isOn) => {
    log.debug('[shidur] got talk event: ', isOn);
    if (!trlAudioJanus) {
      log.debug('[shidur] look like we got talk event before stream init finished');
      setTimeout(() => {
        get().streamGalaxy(isOn);
      }, 1000);
      return;
    }

    if (isOn) {
      // Switch to -1 stream
      const col = 4;
      log.debug('[shidur] Switch audio stream: ', gxycol[col]);
      audioJanus.switch(gxycol[col]);
      const _langtext = await getFromStorage('vrt_langtext');
      const id        = trllang[_langtext];
      // Don't bring translation on toggle trl stream
      if (!id) {
        log.debug('[shidur] no id in local storage or client use togle stream');
      } else {
        log.debug(`[shidur] Switch trl stream: langtext - ${_langtext}, id - ${id}`);
        await trlAudioJanus.switch(id);
      }
      audioStream.getAudioTracks().forEach(track => track._setVolume(0.2));
      log.debug('[shidur] You now talking');
    } else {
      log.debug('[shidur] Stop talking');
      // Bring back source if was choosen before
      const id = await getFromStorage('vrt_lang', 2).then(x => Number(x));
      log.debug('[shidur] get stream back id: ', id);
      await audioJanus.switch(id);
      log.debug('[shidur] Switch audio stream back');
      audioStream.getAudioTracks().forEach(track => track._setVolume(1));
    }
    trlAudioStream.getAudioTracks().forEach(track => track.enabled = isOn);
    set({ talking: isOn });
  },
  toggleIsPlay   : async () => {
    const { initShidur, readyShidur, isMuted } = get();
    const isPlay                               = !get().isPlay;
    if (!readyShidur) {
      await initShidur(isPlay);
    }

    videoStream?.getVideoTracks().forEach(t => t.enabled = isPlay);
    audioStream?.getAudioTracks().forEach(t => t.enabled = isPlay && !isMuted);
    set({ isPlay });
  },
  initQuad       : async () => {
    if (quadStream)
      return;
    const [stream, janusStream] = await initStream(janus, 102);
    set({ quadUrl: stream.toURL(), isQuad: true });
    quadStream = stream;
    quadJanus  = janusStream;
  },
  cleanQuads     : (updateState = true) => {
    cleanStream(quadStream);
    quadStream = null;
    quadJanus?.detach();
    quadJanus = null;

    if (updateState)
      set({ quadUrl: null, isQuad: false });
    else
      set({ quadUrl: null });
  },
  enterAudioMode : () => {
    if (videoJanus) {
      cleanStream(videoStream);
      videoJanus.detach();
      videoJanus = null;
    }

    if (trlAudioJanus) {
      cleanStream(trlAudioStream);
      trlAudioJanus.detach();
      trlAudioJanus = null;
    }
    set({ videoStream: null, trlUrl: null });
  },
  shidurBar      : true,
  toggleShidurBar: (hideOnTimeout = true, shidurBar = !get().shidurBar) => {
    clearTimeout(shidurBarTimeout);
    if (hideOnTimeout) {
      shidurBarTimeout = setTimeout(() => set({ shidurBar: false }), HIDE_BARS_TIMEOUT_MS);
    }
    set({ shidurBar });
  },
}));
