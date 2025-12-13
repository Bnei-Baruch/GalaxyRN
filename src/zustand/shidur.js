import BackgroundTimer from 'react-native-background-timer';
import { create } from 'zustand';
import {
  NO_VIDEO_OPTION_VALUE,
  dualLanguageOptions,
  gxycol,
  sourceStreamOptions,
  trllang,
  workShopOptions,
} from '../consts';
import i18n, { getSystemLanguage } from '../i18n/i18n';
import { waitConnection } from '../libs/connection-monitor';
import { configByName, gatewayNames } from '../libs/janus-config';
import { JanusMqtt } from '../libs/janus-mqtt';
import { ROOM_SESSION } from '../libs/sentry/constants';
import {
  addSpan,
  finishSpan,
  setSpanAttributes,
} from '../libs/sentry/sentryHelper';
import { StreamingPlugin } from '../libs/streaming-plugin';
import api from '../services/Api';
import logger from '../services/logger';
import { getFromStorage, rejectTimeoutPromise, setToStorage } from '../tools';
import { useInRoomStore } from './inRoom';
import { useSettingsStore } from './settings';
import { useUiActions } from './uiActions';
import { useUserStore } from './user';

const NAMESPACE = 'Shidur';

let janus = null;
let kliOlamiJanus = null;
let kliOlamiStream = null;

let videoJanus = null;
let videoStream = null;

let audioJanus = null;
let audioStream = null;

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
    await janus.attach(_janusStream);
    logger.debug(NAMESPACE, 'attach media', media);
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
        description: 'shidur.streamForWorkshopDescription',
      };
    case 'ss':
      return {
        ...sourceStreamOptions.find(x => x.key === key),
        icon: 'center-focus-strong',
        description: 'shidur.sourceStreamDescription',
      };
    case 'dl':
      return {
        ...dualLanguageOptions.find(x => x.key === key),
        icon: 'group',
        description: 'shidur.dualLnaguagesStreamDescription',
      };
    default:
      return workShopOptions.find(x => x.key === 'wo_original');
  }
};

const getAudioKey = async () => {
  const isOriginal = await getFromStorage('is_original', false).then(
    x => x === 'true'
  );
  logger.debug(NAMESPACE, 'initMedias audio', isOriginal);
  if (isOriginal) {
    return 'wo_original';
  }

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
  kliOlamiUrl: null,
  trlUrl: null,
  audioUrl: null,
  readyShidur: false,
  isOnAir: false,
  isPlay: false,
  janusReady: false,
  isMuted: false,
  shidurWIP: false,
  cleanWIP: false,
  isAudioSelectOpen: false,

  setIsAudioSelectOpen: (isAudioSelectOpen = !get().isAudioSelectOpen) => {
    set({ isAudioSelectOpen });
  },

  setIsMuted: (isMuted = !get().isMuted) => {
    if (!get().isPlay) {
      set({ isMuted });
      return;
    }
    const { isOnAir } = get();
    const tracks = isOnAir
      ? trlAudioStream?.getAudioTracks()
      : audioStream?.getAudioTracks();

    tracks?.forEach(t => (t.enabled = !isMuted));
    set({ isMuted });
  },

  setVideo: async (video, updateState = true) => {
    const span = addSpan(ROOM_SESSION, 'shidur.setVideo', {
      NAMESPACE,
      video,
      updateState,
    });
    if (!janus) {
      return;
    }

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
    finishSpan(span, 'ok', NAMESPACE);
  },

  initJanus: async () => {
    const span = addSpan(ROOM_SESSION, 'shidur.initJanus', { NAMESPACE });
    if (janus) {
      finishSpan(span, 'duplicate', NAMESPACE);
      return;
    }
    logger.debug(NAMESPACE, 'initJanus new JanusMqtt');
    const { user } = useUserStore.getState();

    if (!(await waitConnection())) {
      logger.warn(NAMESPACE, 'Connection unavailable in initJanus');
      return;
    }
    logger.debug(NAMESPACE, 'initJanus waitConnection done');

    let srv = null;
    try {
      const _userState = useUserStore.getState().buildUserState();
      logger.debug(NAMESPACE, 'init janus fetchStrServer', _userState);
      srv = await api.fetchStrServer(_userState).then(res => {
        logger.debug(NAMESPACE, 'init janus fetchStrServer result', res);
        return res?.server;
      });

      if (!srv) {
        const gw_list = gatewayNames('streaming');
        let inst = gw_list[Math.floor(Math.random() * gw_list.length)];

        config = configByName(inst);
        srv = config.name;
        logger.debug(NAMESPACE, 'init janus build', inst, config);
      } else {
        config = configByName(srv);
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
      throw error;
    }
    set({ janusReady });
    finishSpan(span, 'ok', NAMESPACE);
  },

  cleanJanus: async () => {
    const span = addSpan(ROOM_SESSION, 'shidur.cleanJanus', { NAMESPACE });
    if (!janus || get().cleanWIP) {
      finishSpan(span, 'duplicate', NAMESPACE);
      return;
    }
    set({ cleanWIP: true });
    try {
      await Promise.all([get().cleanShidur(), get().cleanKliOlami()]);

      logger.debug(NAMESPACE, 'cleanJanus');
      await rejectTimeoutPromise(janus.destroy(), 5000);
    } catch (error) {
      logger.error(NAMESPACE, 'Error during cleanJanus:', error);
      finishSpan(span, 'internal_error', NAMESPACE);
    }
    janus = null;
    set({ cleanWIP: false, janusReady: false });
    finishSpan(span, 'ok', NAMESPACE);
  },

  initMedias: async () => {
    logger.debug(NAMESPACE, 'initMedias called');
    if (get().video && get().audio) {
      logger.debug(NAMESPACE, 'video and audio already set, skipping');
      return;
    }

    let video;
    if (useSettingsStore.getState().audioMode) {
      video = NO_VIDEO_OPTION_VALUE;
    } else {
      video = await getFromStorage('video', 1).then(x => Number(x));
    }
    logger.debug(NAMESPACE, 'initMedias video', video);

    const audioKey = await getAudioKey();
    logger.debug(NAMESPACE, 'initMedias audio', audioKey);
    const audio = getOptionByKey(audioKey);

    logger.debug(NAMESPACE, `initMedias audio: ${JSON.stringify(audio)} `);
    set({ video, audio });
  },

  initShidur: async (isPlay = get().isPlay) => {
    const span = addSpan(ROOM_SESSION, 'shidur.initShidur', {
      NAMESPACE,
      isPlay,
    });
    set({ shidurWIP: true, isPlay, cleanWIP: false });

    logger.debug(NAMESPACE, 'initShidur');

    try {
      await get().initMedias();
      await rejectTimeoutPromise(get().initJanus(), 10000);
    } catch (error) {
      logger.error(NAMESPACE, 'Error during initShidur:', error);
      setSpanAttributes(span, { error });
      set({ shidurWIP: false });
      finishSpan(span, 'internal_error', NAMESPACE);
      throw error;
    }

    if (!useSettingsStore.getState().isShidur || !isPlay) {
      set({ shidurWIP: false });
      setSpanAttributes(span, { isPlay });
      finishSpan(span, 'ok', NAMESPACE);
      return;
    }

    try {
      await Promise.all([get().initVideoHandle(), get().initAudioHandles()]);
      set({ readyShidur: true, shidurWIP: false });
      finishSpan(span, 'ok', NAMESPACE);
    } catch (error) {
      logger.error(NAMESPACE, 'Error during initShidur:', error);
      set({ shidurWIP: false, readyShidur: false });
      setSpanAttributes(span, { error });
      finishSpan(span, 'internal_error', NAMESPACE);
      throw error;
    }
  },

  initVideoHandle: async () => {
    const { video } = get();
    logger.debug(NAMESPACE, `initVideoHandle video: ${video} `);

    if (videoJanus || video === NO_VIDEO_OPTION_VALUE) {
      return;
    }

    try {
      videoJanus = new StreamingPlugin(config?.iceServers);
      videoJanus.onTrack = stream => {
        logger.info(NAMESPACE, 'videoStream got track: ', stream);
        logger.debug(NAMESPACE, 'videoStream previous stream: ', videoStream);
        cleanStream(videoStream);
        videoStream = stream;
        const url = videoStream?.toURL();
        logger.debug(NAMESPACE, 'videoStream got track url: ', url);
        set({ url });
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
        try {
          audioJanus = new StreamingPlugin(config?.iceServers);
        } catch (error) {
          logger.error(NAMESPACE, 'Error during initAudioHandles:', error);
          reject(error);
        }
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
      const audioKey = await getAudioKey();
      logger.debug(NAMESPACE, 'init trlAudioJanus audioKey', audioKey);
      const id = trllang[audioKey?.split('_')[1]];
      logger.debug(NAMESPACE, 'initAudioHandles trlAudioJanus id', id);
      const trlPromise = new Promise((resolve, reject) => {
        try {
          trlAudioJanus = new StreamingPlugin(config?.iceServers);
        } catch (error) {
          logger.error(NAMESPACE, 'Error during initAudioHandles:', error);
          reject(error);
        }
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

    Promise.all(promises).then(() => {
      logger.debug(NAMESPACE, 'initAudioHandles promises done');
      if (get().isOnAir) {
        get().streamGalaxy(true, true);
      }
    });
  },

  cleanShidur: async () => {
    logger.debug(NAMESPACE, 'cleanShidur');
    await Promise.all([get().cleanVideoHandle(), get().cleanAudioHandles()]);

    set({ readyShidur: false, isPlay: false, url: null });
    logger.debug(NAMESPACE, 'cleanShidur done');
  },

  cleanVideoHandle: async () => {
    logger.debug(NAMESPACE, 'cleanShidur videoStream', videoStream);
    cleanStream(videoStream);
    videoStream = null;

    try {
      if (videoJanus) {
        await rejectTimeoutPromise(janus.detach(videoJanus), 2000);
      }
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
      if (audioJanus) {
        await rejectTimeoutPromise(janus.detach(audioJanus), 2000);
      }
    } catch (error) {
      logger.error(NAMESPACE, 'Error during cleanAudioHandles:', error);
    }
    audioJanus = null;

    logger.debug(NAMESPACE, 'cleanShidur trlAudioStream', trlAudioStream);
    cleanStream(trlAudioStream);
    trlAudioStream = null;
    try {
      if (trlAudioJanus) {
        await rejectTimeoutPromise(janus.detach(trlAudioJanus), 2000);
      }
    } catch (error) {
      logger.error(NAMESPACE, 'Error during cleanAudioHandles:', error);
    }
    trlAudioJanus = null;
  },

  restartShidur: async () => {
    logger.debug(NAMESPACE, 'restartShidur');
    if (get().shidurWIP || get().cleanWIP) {
      logger.debug(NAMESPACE, 'restartShidur skipped, already in progress');
      return;
    }

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
      attempts = 0;
    } catch (error) {
      attempts++;
      useInRoomStore.getState().restartRoom();
      logger.error(NAMESPACE, 'Error during restartShidur:', error);
    } finally {
      set({ shidurWIP: false });
    }
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
      useUiActions.getState().toggleShowBars();
      set({ readyShidur: true });
      return;
    }

    videoStream?.getVideoTracks().forEach(t => (t.enabled = isPlay));
    audioStream
      ?.getAudioTracks()
      .forEach(t => (t.enabled = isPlay && !isMuted));
    logger.debug(NAMESPACE, 'toggleIsPlay done', isPlay);
    set({ isPlay });
  },

  initKliOlami: async () => {
    if (!useSettingsStore.getState().showGroups) return;

    if (kliOlamiStream) return;

    kliOlamiJanus = new StreamingPlugin(config?.iceServers);
    kliOlamiJanus.onTrack = stream => {
      logger.info(NAMESPACE, 'kliOlamiStream got track: ', stream);
      cleanStream(kliOlamiStream);
      kliOlamiStream = stream;
      set({ kliOlamiUrl: kliOlamiStream.toURL() });
    };
    await initStream(102, kliOlamiJanus);
  },

  cleanKliOlami: async (updateState = true) => {
    cleanStream(kliOlamiStream);
    kliOlamiStream = null;
    try {
      if (kliOlamiJanus) {
        await rejectTimeoutPromise(janus.detach(kliOlamiJanus), 2000);
      }
    } catch (error) {
      logger.error(NAMESPACE, 'Error during cleanKliOlami:', error);
    }
    kliOlamiJanus = null;

    if (updateState) set({ kliOlamiUrl: null });
    else set({ kliOlamiUrl: null });
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
    const { initKliOlami, isPlay, video: currentVideo, setVideo } = get();
    try {
      initKliOlami();
    } catch (error) {
      logger.error(NAMESPACE, 'Error during initKliOlami:', error);
    }

    if (!useSettingsStore.getState().isShidur || !isPlay) {
      logger.debug(NAMESPACE, 'exitAudioMode shidur not active');
      return;
    }

    let video;
    if (useSettingsStore.getState().audioMode) {
      video = NO_VIDEO_OPTION_VALUE;
    } else {
      video = await getFromStorage('video', 1).then(x => Number(x));
    }
    console.log('exitAudioMode video', video, currentVideo);
    if (video !== currentVideo) {
      setVideo(video, false);
    }
  },

  setAudio: async key => {
    const audio = getOptionByKey(key);
    const span = addSpan(ROOM_SESSION, 'shidur.setAudio', { NAMESPACE });
    logger.debug(NAMESPACE, 'setAudio', audio);

    try {
      if (get().isOnAir) {
        const key = trllang[audio.key.split('_')[1]];
        if (key) {
          const switchResult = await trlAudioJanus.switch(key);
          if (switchResult?.error) {
            logger.warn(
              NAMESPACE,
              `Failed to switch trl audio to ${key}, error: ${switchResult.error}`
            );
          }
        }
      } else {
        const switchResult = await audioJanus?.switch(audio.value);
        if (switchResult?.error) {
          logger.warn(
            NAMESPACE,
            `Failed to switch audio to ${audio.value}, error: ${switchResult.error}`
          );
        }
      }
    } catch (error) {
      logger.error(NAMESPACE, 'Error in setAudio', error);
    }

    logger.debug(NAMESPACE, 'set audio', audio);
    const isOriginal = audio.key === 'wo_original';
    setSpanAttributes(span, { isOriginal, NAMESPACE });

    if (!isOriginal) {
      await Promise.all([
        setToStorage('audio', audio.key),
        setToStorage('is_original', false),
      ]);
    } else {
      await setToStorage('is_original', true);
    }

    setSpanAttributes(span, { audio, NAMESPACE });
    set({ audio });
    finishSpan(span, 'ok', NAMESPACE);
  },

  toggleIsOriginal: async () => {
    const isOriginal = await getFromStorage('is_original', false).then(
      x => x === 'true'
    );
    logger.debug(NAMESPACE, 'toggleIsOriginal', (!isOriginal).toString());
    await setToStorage('is_original', (!isOriginal).toString());
    const key = await getAudioKey();
    logger.debug(NAMESPACE, 'toggleIsOriginal key', key);
    get().setAudio(key);
  },
}));
