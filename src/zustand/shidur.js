// External libraries
import BackgroundTimer from 'react-native-background-timer';
import { create } from 'zustand';

// Libs
import { JanusMqtt } from '../libs/janus-mqtt';
import { StreamingPlugin } from '../libs/streaming-plugin';

// Services
import logger from '../services/logger';

// Shared modules
import i18n, { getSystemLanguage } from '../i18n/i18n';
import { waitConnection } from '../libs/connection-monitor';
import api from '../shared/Api';
import {
  NO_VIDEO_OPTION_VALUE,
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
let attempts = 0;

const initStream = async (media, _janusStream) => {
  if (!janus) return [];
  try {
    _janusStream.onStatus = async (srv, status) => {
      logger.warn(NAMESPACE, 'janus status: ', status);
      if (status === 'offline') {
        get().restartShidur();
      }
    };
    const _data = await janus.attach(_janusStream);
    logger.debug(NAMESPACE, 'attach media', _data);
    await _janusStream.init(media);
  } catch (error) {
    logger.error(NAMESPACE, 'stream error', error);
    return null;
  }
};

const cleanStream = stream =>
  stream?.getTracks().forEach(track => {
    track.stop();
    track.enabled = false;
  });

const getOptionByKey = key => {
  const _type = key.split('_')[0];
  logger.debug(NAMESPACE, 'getOptionByKey', key, _type);
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

const getAudioKey = async () => {
  let audioKey = await getFromStorage('audio');
  if (!audioKey) {
    const systemLang = getSystemLanguage();
    audioKey = `wo_${systemLang}`;
    if (!workShopOptions.find(x => x.key === audioKey)) {
      audioKey = `wo_${i18n.language}`;
    }
  }
  logger.debug(NAMESPACE, 'getAudioKey', audioKey);
  return audioKey;
};

export const useShidurStore = create((set, get) => ({
  video: null,
  audio: null,
  url: null,
  quadUrl: null,
  trlUrl: null,
  audioUrl: null,
  readyShidur: false,
  isOnAir: false,
  isPlay: false,
  janusReady: false,
  isMuted: false,
  shidurWIP: false,
  cleanWIP: false,

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
      await get().cleanVideoHandle();
    } else {
      if (videoJanus) {
        await videoJanus.switch(video);
      } else {
        set({ video });
        await get().initVideoHandle();
        return;
      }
    }
    logger.debug(NAMESPACE, 'setVideo done', videoStream?.toURL(), video);
    set({ url: videoStream?.toURL(), video });
  },

  initJanus: async () => {
    if (janus) {
      return;
    }

    const { user } = useUserStore.getState();

    if (!(await waitConnection())) {
      logger.warn(NAMESPACE, 'Connection unavailable in initJanus');
      return;
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
      janus.onStatus = (srv, status) => {
        logger.debug(NAMESPACE, 'janus status: ', status);
        if (status === 'offline') {
          logger.warn(NAMESPACE, 'janus status: ', status);
          useInRoomStore.getState().restartRoom();
        }
      };

      await janus.init(config?.token);
      logger.debug(NAMESPACE, 'init janus ready');
      janusReady = true;
    } catch (error) {
      logger.error(NAMESPACE, 'Error during init janus:', error);
    }
    set({ janusReady });
  },

  cleanJanus: async () => {
    if (!janus || get().cleanWIP) return;
    set({ cleanWIP: true });
    try {
      await Promise.all([get().cleanShidur(), get().cleanQuads()]);

      logger.debug(NAMESPACE, 'cleanJanus');
      await janus.destroy();
      janus = null;
    } catch (error) {
      logger.error(NAMESPACE, 'Error during cleanJanus:', error);
    }
    set({ janusReady: false });
    set({ cleanWIP: false });
  },

  initMedias: async () => {
    logger.debug(NAMESPACE, 'initMedias');
    if (get().video && get().audio) return;

    let video;
    if (useSettingsStore.getState().audioMode) {
      video = NO_VIDEO_OPTION_VALUE;
    } else {
      video = await getFromStorage('video', 1).then(x => Number(x));
    }
    logger.debug(NAMESPACE, 'initMedias video', video);

    let audio;
    const isOriginal = await getFromStorage('is_original', false).then(
      x => x === 'true'
    );
    logger.debug(NAMESPACE, 'initMedias audio', isOriginal);
    if (isOriginal) {
      audio = getOptionByKey('wo_original');
    } else {
      const audioKey = await getAudioKey();
      audio = getOptionByKey(audioKey);
    }
    logger.debug(NAMESPACE, `initMedias audio: ${JSON.stringify(audio)} `);
    set({ video, audio });
  },

  initShidur: async (isPlay = get().isPlay) => {
    logger.debug(NAMESPACE, 'initShidur isPlay', isPlay);
    set({ shidurWIP: true, isPlay });
    logger.debug(NAMESPACE, 'initShidur');

    try {
      await get().initMedias();
      await get().initJanus();
    } catch (error) {
      logger.error(NAMESPACE, 'Error during initShidur:', error);
    }

    if (!useSettingsStore.getState().isShidur || !isPlay) {
      set({ shidurWIP: false });
      return;
    }

    await Promise.all([get().initVideoHandle(), get().initAudioHandles()]);
  },

  initVideoHandle: async () => {
    const { video } = get();
    logger.debug(NAMESPACE, `initVideoHandle video: ${video} `);

    if (videoJanus || video === NO_VIDEO_OPTION_VALUE) {
      set({ readyShidur: true, shidurWIP: false });
      return;
    }

    try {
      videoJanus = new StreamingPlugin(config?.iceServers);
      videoJanus.onTrack = stream => {
        logger.info(NAMESPACE, 'videoStream got track: ', stream);
        logger.debug(NAMESPACE, 'videoStream got track url: ', videoStream);
        cleanStream(videoStream);
        videoStream = stream;
        set({
          url: videoStream?.toURL(),
          readyShidur: true,
          shidurWIP: false,
        });
      };
      initStream(video, videoJanus);
    } catch (error) {
      logger.error(NAMESPACE, 'Error during initVideoHandle:', error);
    }
  },

  initAudioHandles: async () => {
    const { audio } = get();
    logger.debug(NAMESPACE, `initHandles audio: ${JSON.stringify(audio)}`);

    const promises = [];
    logger.debug(NAMESPACE, 'initShidur has audioJanus', !!audioJanus);
    if (!audioJanus) {
      const audioPromise = new Promise((resolve, reject) => {
        audioJanus = new StreamingPlugin(config?.iceServers);
        audioJanus.onTrack = stream => {
          logger.info(NAMESPACE, 'audioStream got track: ', stream);
          cleanStream(audioStream);
          audioStream = stream;
          resolve();
        };
        initStream(audio.value, audioJanus);
      });
      promises.push(audioPromise);
    }

    logger.debug(NAMESPACE, 'initShidur has trlAudioJanus', !!trlAudioJanus);
    if (!trlAudioJanus) {
      logger.debug(NAMESPACE, 'init trlAudioJanus');
      const audioKey = await getFromStorage('audio', null);
      const id = trllang[audioKey?.split('_')[1]];
      if (id) {
        const trlPromise = new Promise((resolve, reject) => {
          trlAudioJanus = new StreamingPlugin(config?.iceServers);
          trlAudioJanus.onTrack = stream => {
            logger.info(NAMESPACE, 'trlAudioStream got track: ', stream);
            cleanStream(trlAudioStream);
            stream?.getAudioTracks()?.forEach(track => (track.enabled = false));
            trlAudioStream = stream;
            resolve();
          };
          initStream(id, trlAudioJanus);
          promises.push(trlPromise);
        });
      }
    }

    Promise.all(promises).then(() => {
      if (get().isOnAir) {
        get().streamGalaxy(true, true);
      }
    });
  },

  cleanShidur: async () => {
    await Promise.all([get().cleanVideoHandle(), get().cleanAudioHandles()]);

    set({ readyShidur: false, isPlay: false, url: null });
    logger.debug(NAMESPACE, 'cleanShidur done');
  },

  cleanVideoHandle: async () => {
    logger.debug(NAMESPACE, 'cleanShidur videoStream', videoStream);
    cleanStream(videoStream);
    videoStream = null;
    try {
      await videoJanus?.detach();
    } catch (error) {
      logger.error(NAMESPACE, 'Error during cleanVideoHandle:', error);
    }
    videoJanus = null;
  },

  cleanAudioHandles: async () => {
    logger.debug(NAMESPACE, 'cleanShidur audioStream', audioStream);
    cleanStream(audioStream);
    audioStream = null;
    try {
      await audioJanus?.detach();
    } catch (error) {
      logger.error(NAMESPACE, 'Error during cleanAudioHandles:', error);
    }
    audioJanus = null;

    logger.debug(NAMESPACE, 'cleanShidur trlAudioStream', trlAudioStream);
    cleanStream(trlAudioStream);
    trlAudioStream = null;
    try {
      await trlAudioJanus?.detach();
    } catch (error) {
      logger.error(NAMESPACE, 'Error during cleanAudioHandles:', error);
    }
    trlAudioJanus = null;
  },

  restartShidur: async () => {
    logger.debug(NAMESPACE, 'restartShidur');
    if (get().shidurWIP) return;

    set({ shidurWIP: true });

    try {
      if (attempts > 3) {
        throw new Error('Failed to restart shidur', attempts);
      }
      const isPlay = get().isPlay;
      logger.debug(NAMESPACE, 'restartShidur', isPlay);
      await get().cleanShidur();
      set({ isPlay });
      await Promise.all([get().initVideoHandle(), get().initAudioHandles()]);
      attempts++;
    } catch (error) {
      useInRoomStore.getState().restartRoom();
      logger.error(NAMESPACE, 'Error during restartShidur:', error);
    }
    set({ shidurWIP: false });
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

    if (!trlAudioStream || !audioStream) {
      logger.debug(
        NAMESPACE,
        'look like we got talk event before stream init finished'
      );

      BackgroundTimer.setTimeout(() => {
        get().streamGalaxy(isOnAir, onPlay);
      }, 1000);
      return;
    }
    logger.debug(NAMESPACE, 'streamGalaxy isOnAir', isOnAir, onPlay);

    if (isOnAir) {
      // Switch to -1 stream
      const col = 4;
      logger.debug(NAMESPACE, 'Switch audio stream: ', gxycol[col]);
      audioJanus.switch(gxycol[col]);
      const _langtext = await getFromStorage('audio');
      const id = trllang[_langtext];
      logger.debug(NAMESPACE, 'streamGalaxy trl stream id', id);
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
    logger.debug(NAMESPACE, 'Switch trl stream back', isOnAir);
    trlAudioStream
      ?.getAudioTracks()
      ?.forEach(track => (track.enabled = isOnAir));
    set({ isOnAir });
  },

  toggleIsPlay: async () => {
    const { initVideoHandle, initAudioHandles, readyShidur, isMuted } = get();
    const isPlay = !get().isPlay;
    logger.debug(NAMESPACE, 'toggleIsPlay', isPlay, readyShidur);
    if (!readyShidur) {
      set({ isPlay });
      await Promise.all([initVideoHandle(), initAudioHandles()]);
      return;
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

    quadJanus = new StreamingPlugin(config?.iceServers);
    quadJanus.onTrack = stream => {
      logger.info(NAMESPACE, 'quadStream got track: ', stream);
      cleanStream(quadStream);
      quadStream = stream;
      set({ quadUrl: quadStream.toURL() });
    };
    await initStream(102, quadJanus);
    set({ isQuad: true });
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
    logger.debug(NAMESPACE, 'enterAudioMode');
    if (!useSettingsStore.getState().isShidur || !get().isPlay) {
      logger.debug(NAMESPACE, 'enterAudioMode shidur not active');
      set({ video: NO_VIDEO_OPTION_VALUE });
      return;
    }
    get().setVideo(NO_VIDEO_OPTION_VALUE, false);
  },

  exitAudioMode: async () => {
    const { initQuad, isPlay, video: currentVideo, setVideo } = get();
    await initQuad();

    if (!useSettingsStore.getState().isShidur || !isPlay) {
      logger.debug(NAMESPACE, 'exitAudioMode shidur not active');
      return;
    }

    const video = await getFromStorage('video', 1).then(x => Number(x));
    if (video !== currentVideo) {
      setVideo(video, false);
    }
  },

  setAudio: async key => {
    const audio = getOptionByKey(key);
    logger.debug(NAMESPACE, 'setAudio', audio);
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
      Promise.all([
        setToStorage('audio', audio.key),
        setToStorage('is_original', false),
      ]);
    } else {
      await setToStorage('is_original', true);
    }

    set({ audio });
  },

  toggleIsOriginal: async () => {
    logger.debug(NAMESPACE, 'toggleIsOriginal');
    const isOriginal = !(get().audio.key === 'wo_original');
    let key;
    if (isOriginal) {
      key = 'wo_original';
    } else {
      key = await getAudioKey();
    }
    logger.debug(NAMESPACE, 'toggleIsOriginal key', key);
    get().setAudio(key);
  },
}));
