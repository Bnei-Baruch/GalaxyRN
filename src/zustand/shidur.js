import { create } from 'zustand';
import { JanusMqtt } from '../libs/janus-mqtt';
import GxyJanus from '../shared/janus-utils';
import log from 'loglevel';
import { StreamingPlugin } from '../libs/streaming-plugin';
import { NO_VIDEO_OPTION_VALUE, trllang, VIDEO_240P_OPTION_VALUE, } from '../shared/consts';
import { useUserStore } from './user';
import RNSecureStorage from 'rn-secure-storage';

let janus                   = null;
let videoJanusStream        = null;
let audioJanusStream        = null;
let trlAudioJanusStream     = null;
let videoQuadStream         = null;
export const useShidurStore = create((set) => ({
  video      : VIDEO_240P_OPTION_VALUE,
  audio      : 64,
  trl        : null,
  videoStream: null,
  audioStream: null,
  trlStream  : null,
  quadStream : null,
  setVideo   : (video) => set((state) => ({ video })),
  setAudio   : (audio) => set((state) => ({ audio })),
  setTrl     : (trl) => set((state) => ({ trl })),
  init       : async (srv) => {
    console.log('SHIDUR init');
    if (janus) return;

    const { video, audio } = useShidurStore.getState();
    const { user }         = useUserStore.getState();

    let str    = srv;
    let config = null;
    if (!srv) {
      const gw_list = GxyJanus.gatewayNames('streaming');
      let inst      = gw_list[Math.floor(Math.random() * gw_list.length)];
      config        = GxyJanus.instanceConfig(inst);
      str           = config.name;
    }
    console.log('init shidur config', config);
    const initVideoStream = () => {
      if (video === NO_VIDEO_OPTION_VALUE) return;
      videoJanusStream          = new StreamingPlugin(config?.iceServers);
      videoJanusStream.onStatus = () => {
        if (janus) initVideoStream();
      };
      janus.attach(videoJanusStream).then((data) => {
        log.debug('[shidur] attach video', data);
        videoJanusStream.watch(video).then((videoStream) => {
          set(state => ({ videoStream }));
        });
      });
    };

    const initAudioStream = () => {
      audioJanusStream          = new StreamingPlugin(config?.iceServers);
      audioJanusStream.onStatus = () => {
        if (janus) initAudioStream();
      };

      janus.attach(audioJanusStream).then((data) => {
        log.debug('[shidur] attach audio', data);
        audioJanusStream.watch(audio).then((audioStream) => {
          set(state => ({ audioStream }));
        });
      });
    };

    const initTranslationStream = (streamId) => {
      trlAudioJanusStream          = new StreamingPlugin(config?.iceServers);
      trlAudioJanusStream.onStatus = () => {
        if (janus) initTranslationStream(streamId);
      };
      janus.attach(trlAudioJanusStream).then((data) => {
        log.debug('[shidur] attach translation', data);
        trlAudioJanusStream.watch(streamId).then((trlStream) => {
          set(() => ({ trlStream }));
        });
      });
    };

    const initQuadStream = () => {
      videoQuadStream          = new StreamingPlugin(config?.iceServers);
      videoQuadStream.onStatus = () => {
        if (janus) initQuadStream();
      };
      janus.attach(videoQuadStream).then((data) => {
        log.debug('[shidur] attach quad', data);
        videoQuadStream.watch(102).then((quadStream) => {
          set(() => ({ quadStream }));
        });
      });
    };

    janus          = new JanusMqtt(user, str);
    janus.onStatus = (srv, status) => {
      if (status !== 'online') {
        log.warn('[shidur] janus status: ', status);
        if (janus) janus.destroy();
        janus = null;
        setTimeout(() => {
          useShidurStore.getState().init();
        }, 7000);
      }
    };

    await janus.init();
    if (!videoJanusStream) {
      initVideoStream();
    }
    if (!audioJanusStream) {
      initAudioStream();
    }
    if (!trlAudioJanusStream) {
      try {
        const _lang = await RNSecureStorage.getItem('vrt_langtext');
        initTranslationStream(trllang[_lang] || 301);
      } catch (err) {
        log.error('saved room: ', err);
      }
    }
  },
}));