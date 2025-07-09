// External libraries
import { create } from 'zustand';

// Libs
import { JanusMqtt } from '../libs/janus-mqtt';
import { StreamingPlugin } from '../libs/streaming-plugin';

// Services
import logger from '../services/logger';

// Shared modules
import api from '../shared/Api';
import {
  NO_VIDEO_OPTION_VALUE,
  VIDEO_240P_OPTION_VALUE,
  dualLanguageOptions,
  gxycol,
  sourceStreamOptions,
  trllang,
  workShopOptions,
} from '../shared/consts';
import GxyConfig from '../shared/janus-config';
import { getFromStorage, setToStorage } from '../shared/tools';

// Zustand stores
import { useInRoomStore } from './inRoom';
import { useSettingsStore } from './settings';
import { useUserStore } from './user';

const NAMESPACE = 'Shidur';

let janus = null;
let cleanWIP = false;
let quadJanus = null;
let quadStream = null;

// Streaming plugin for video
let videoJanus = null;
let videoStream = null;

// Streaming plugin for audio
let audioJanus = null;
let audioStream = null;

// Streaming plugin for trlAudio
let trlAudioJanus = null;
let trlAudioStream = null;

let config = null;

const initStream = async (_janus, media) => {
  if (!_janus) return [];
  try {
    const janusStream = new StreamingPlugin(config?.iceServers);
    janusStream.onStatus = async (srv, status) => {
      if (status !== 'online') {
        logger.warn(NAMESPACE, 'janus status: ', status);
        useInRoomStore.getState().restartRoom();
      }
    };
    const _data = await _janus.attach(janusStream);
    logger.debug(NAMESPACE, 'attach media', _data);
    const stream = await janusStream.watch(media);
    return [stream, janusStream];
  } catch (error) {
    logger.error(
      NAMESPACE,
      'stream error',
      error?.message || JSON.stringify(error) || 'undefined'
    );
    return [];
  }
};

const cleanStream = stream =>
  stream?.getTracks().forEach(track => track.stop());

const getOptionByKey = key => {
  const _type = key.split('_')[0];
  switch (_type) {
    case 'wo':
      return {
        ...workShopOptions.find(x => x.key === key),
        icon: 'group',
      };
    case 'ss':
      return {
        ...sourceStreamOptions.find(x => x.key === key),
        icon: 'center-focus-strong',
      };
    case 'dl':
      return {
        ...dualLanguageOptions.find(x => x.key === key),
        icon: 'group',
      };
    default:
      return workShopOptions.find(x => x.key === 'wo_original');
  }
};

export const useShidurStore = create((set, get) => ({
  video: VIDEO_240P_OPTION_VALUE,
  audio: 64,
  audio: {},
  url: null,
  quadUrl: null,
  trlUrl: null,
  audioUrl: null,
  readyShidur: false,
  isOnAir: false,
  isPlay: false,
  janusReady: false,
  isMuted: false,
  isAutoPlay: false,
  shidurWIP: false,

  setIsMuted: (isMuted = !get().isMuted) => {
    [
      ...(audioStream?.getAudioTracks() || []),
      ...(trlAudioStream?.getAudioTracks() || []),
    ].forEach(t => {
      t.enabled = !isMuted;
      !isMuted && t._setVolume(0.8);
    });
    set({ isMuted });
  },

  setVideo: async (video, updateState = true) => {
    logger.debug(NAMESPACE, 'setVideo', video, updateState);
    if (!janus) return;
    if (updateState) {
      await setToStorage('video', video);
    }
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
        set({ video });
        await get().initShidur();
        return;
      }
    }

    set({ url: videoStream?.toURL(), video });
  },

  initJanus: async () => {
    set({ shidurWIP: true });
    const { user } = useUserStore.getState();
    if (janus) {
      get().cleanJanus();
    }

    let srv = null;
    try {
      const _userState = useUserStore.getState().buildUserState();
      logger.debug(NAMESPACE, 'init janus fetchStrServer', _userState);
      srv = await api.fetchStrServer(_userState).then(res => {
        logger.debug(NAMESPACE, 'init janus fetchStrServer result', res);
        return res?.server;
      });

      if (!srv) {
        const gw_list = GxyConfig.gatewayNames('streaming');
        let inst = gw_list[Math.floor(Math.random() * gw_list.length)];

        config = GxyConfig.instanceConfig(inst);
        srv = config.name;
        logger.debug(NAMESPACE, 'init janus build', inst, config);
      } else {
        config = GxyConfig.instanceConfig(srv);
      }
    } catch (error) {
      logger.error(NAMESPACE, 'Error during fetchStrServer:', error);
    }

    let janusReady = false;
    try {
      logger.debug(NAMESPACE, 'new JanusMqtt', user, srv);
      janus = new JanusMqtt(user, srv);

      await janus.init(config.token);
      logger.debug(NAMESPACE, 'init janus ready');
      janusReady = true;
    } catch (error) {
      logger.error(NAMESPACE, 'Error during init janus:', error);
    }
    set({ janusReady, shidurWIP: false });
  },

  cleanJanus: async () => {
    if (!janus || cleanWIP) return;
    cleanWIP = true;
    try {
      get().cleanShidur();
      get().cleanQuads();

      logger.debug(NAMESPACE, 'cleanJanus');
      await janus.destroy();
      janus = null;
      videoJanus = null;
      audioJanus = null;
      trlAudioJanus = null;
      set({ janusReady: false });
    } catch (error) {
      logger.error(NAMESPACE, 'Error during cleanJanus:', error);
    }
    cleanWIP = false;
  },

  initAudio: async () => {
    let video;
    if (useSettingsStore.getState().audioMode) {
      video = NO_VIDEO_OPTION_VALUE;
    } else {
      video = await getFromStorage('video', 1).then(x => Number(x));
    }

    let audio;
    const isOriginal = await getFromStorage('is_original', false).then(
      x => x === 'true'
    );
    logger.debug(NAMESPACE, 'initAudio', isOriginal);
    if (isOriginal) {
      audio = getOptionByKey('wo_original');
    } else {
      const { uiLang } = useSettingsStore.getState();
      const audioKey = await getFromStorage('audio', `wo_${uiLang}`);
      audio = getOptionByKey(audioKey);
      logger.debug(
        NAMESPACE,
        'initAudio isOriginal false',
        audio,
        audioKey,
        uiLang
      );
    }

    set({ video, audio });
  },

  initShidur: async (isPlay = get().isPlay) => {
    set({ shidurWIP: true });
    logger.debug(NAMESPACE, 'initShidur');
    if (!useSettingsStore.getState().isShidur || !isPlay) return;

    try {
      const { video, audio } = get();
      if (!videoJanus && video !== NO_VIDEO_OPTION_VALUE) {
        const [stream, janusStream] = await initStream(janus, video);
        videoStream = stream;
        videoJanus = janusStream;
      }
      if (!audioJanus) {
        const [stream, janusStream] = await initStream(janus, audio.value);
        audioStream = stream;
        audioJanus = janusStream;
      }
      if (!trlAudioJanus) {
        logger.debug(NAMESPACE, 'init trlAudioJanus');
        const audioKey = await getFromStorage('audio', null);
        const id = trllang[audioKey?.split('_')[1]];
        if (id) {
          const [stream, janusStream] = await initStream(janus, id);
          stream?.getAudioTracks()?.forEach(track => (track.enabled = false));
          trlAudioStream = stream;
          trlAudioJanus = janusStream;
        }
      }
    } catch (error) {
      logger.error(NAMESPACE, 'Error during initShidur:', error);
    }

    logger.debug(NAMESPACE, 'streams are ready', videoStream);
    set({ url: videoStream?.toURL(), readyShidur: true, shidurWIP: false });

    if (get().isOnAir) {
      get().streamGalaxy(true, true);
    }
  },

  cleanShidur: () => {
    logger.debug(NAMESPACE, 'cleanShidur');
    cleanStream(videoStream);
    videoStream = null;

    cleanStream(audioStream);
    audioStream = null;

    cleanStream(trlAudioStream);
    trlAudioStream = null;

    set({
      readyShidur: false,
      isPlay: false,
      url: null,
      isOnAir: false,
    });
  },

  streamGalaxy: async (isOnAir, onPlay = false) => {
    logger.debug(NAMESPACE, 'got talk event: ', isOnAir, get().isOnAir);
    if (isOnAir === get().isOnAir && !onPlay) {
      logger.debug(NAMESPACE, 'talk event is the same as current state');
      return;
    }

    if (!get().isPlay && !onPlay) {
      logger.debug(NAMESPACE, 'start streamGalaxy after isPlay is true');
      set({ isOnAir });
      return;
    }

    if (!trlAudioJanus) {
      logger.debug(
        NAMESPACE,
        'look like we got talk event before stream init finished'
      );
      setTimeout(() => {
        get().streamGalaxy(isOnAir);
      }, 1000);
      return;
    }

    if (isOnAir) {
      // Switch to -1 stream
      const col = 4;
      logger.debug(NAMESPACE, 'Switch audio stream: ', gxycol[col]);
      audioJanus.switch(gxycol[col]);
      const _langtext = await getFromStorage('audio');
      const id = trllang[_langtext];
      // Don't bring translation on toggle trl stream
      if (!id) {
        logger.debug(
          NAMESPACE,
          'no id in local storage or client use togle stream'
        );
      } else {
        logger.debug(
          NAMESPACE,
          `Switch trl stream: langtext - ${_langtext}, id - ${id}`
        );
        await trlAudioJanus.switch(id);
      }
      audioStream?.getAudioTracks().forEach(track => track._setVolume(0.2));
      logger.debug(NAMESPACE, 'You now talking');
    } else {
      logger.debug(NAMESPACE, 'Stop talking');
      // Bring back source if was choosen before
      const id = get().audio.value;
      logger.debug(NAMESPACE, 'get stream back id: ', id);
      await audioJanus.switch(id);
      logger.debug(NAMESPACE, 'Switch audio stream back');
      audioStream?.getAudioTracks().forEach(track => track._setVolume(0.8));
    }
    trlAudioStream
      ?.getAudioTracks()
      ?.forEach(track => (track.enabled = isOnAir));
    set({ isOnAir });
  },

  toggleIsPlay: async (isPlay = !get().isPlay) => {
    const { initShidur, readyShidur, isMuted } = get();
    logger.debug(NAMESPACE, 'toggleIsPlay', isPlay, readyShidur);
    if (!readyShidur) {
      await initShidur(isPlay);
    }

    videoStream?.getVideoTracks().forEach(t => (t.enabled = isPlay));
    audioStream
      ?.getAudioTracks()
      .forEach(t => (t.enabled = isPlay && !isMuted));
    logger.debug(NAMESPACE, 'toggleIsPlay done', isPlay);
    set({ isPlay });
  },

  initQuad: async () => {
    if (quadStream) return;
    const [stream, janusStream] = await initStream(janus, 102);
    set({ quadUrl: stream.toURL(), isQuad: true });
    quadStream = stream;
    quadJanus = janusStream;
  },
  cleanQuads: (updateState = true) => {
    cleanStream(quadStream);
    quadStream = null;
    quadJanus?.detach();
    quadJanus = null;

    if (updateState) set({ quadUrl: null, isQuad: false });
    else set({ quadUrl: null });
  },

  enterAudioMode: () => {
    if (!useSettingsStore.getState().isShidur || !get().isPlay) return;
    get().setVideo(NO_VIDEO_OPTION_VALUE, false);
    set({ url: null, trlUrl: null });
  },

  exitAudioMode: async () => {
    const { video: _video, setVideo, initQuad, isPlay } = get();
    await initQuad();

    if (!useSettingsStore.getState().isShidur || !isPlay) return;

    const video = await getFromStorage('video', 1).then(x => Number(x));
    logger.debug(NAMESPACE, 'exitAudioMode', _video, video);
    if (_video !== video) setVideo(video, false);
  },

  setAutoPlay: isAutoPlay => set({ isAutoPlay }),

  setAudio: async key => {
    const audio = getOptionByKey(key);
    if (get().isOnAir) {
      const key = trllang[audio.key.split('_')[1]];
      if (key) {
        await trlAudioJanus.switch(id);
      }
    } else {
      await audioJanus?.switch(audio.value);
    }
    logger.debug(NAMESPACE, 'set audio', audio);
    const isOriginal = audio.key === 'wo_original';
    if (!isOriginal) {
      await setToStorage('audio', audio.key);
      await setToStorage('is_original', false);
    } else {
      await setToStorage('is_original', true);
    }

    set({ audio });
  },

  toggleIsOriginal: async () => {
    const isOriginal = !(get().audio.key === 'wo_original');
    let key;
    if (isOriginal) {
      key = 'wo_original';
    } else {
      const { uiLang } = useSettingsStore.getState();
      key = await getFromStorage('audio', `wo_${uiLang}`);
    }

    get().setAudio(key);
  },
}));
