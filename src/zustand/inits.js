// External libraries
import BackgroundTimer from 'react-native-background-timer';
import { create } from 'zustand';

// React Native modules
import { NativeEventEmitter } from 'react-native';

// Services
import CallsBridge from '../services/CallsBridge';
import logger from '../services/logger';

// Auth
import kc from '../auth/keycloak';

// Shared modules
import api from '../shared/Api';
import ConfigStore from '../shared/ConfigStore';
import GxyConfig from '../shared/janus-config';
import mqtt from '../shared/mqtt';
import { getFromStorage } from '../shared/tools';

// Zustand stores
import { useChatStore } from './chat';
import { modalModes } from './helper';
import { useInRoomStore } from './inRoom';
import { useMyStreamStore } from './myStream';
import { useSettingsStore } from './settings';
import { useShidurStore } from './shidur';
import { useUiActions } from './uiActions';
import { useUserStore } from './user';

const NAMESPACE = 'Inits';
const CLIENT_RECONNECT_TYPES = [
  'client-reconnect',
  'client-reload',
  'client-disconnect',
];

// Safely create event emitter only if CallsBridge.raw is defined
let eventEmitter;
try {
  if (CallsBridge && CallsBridge.raw) {
    eventEmitter = new NativeEventEmitter(CallsBridge.raw);
  } else {
    logger.warn(
      NAMESPACE,
      'CallsBridge.raw is undefined, event emitter not created'
    );
  }
} catch (error) {
  logger.error(NAMESPACE, 'Error creating NativeEventEmitter:', error);
}

let subscription = null;

export const useInitsStore = create((set, get) => ({
  permissionsReady: false,
  setPermissionsReady: (permissionsReady = true) => set({ permissionsReady }),

  mqttReady: false,
  configReady: false,
  readyForJoin: false,
  setReadyForJoin: (readyForJoin = true) => set({ readyForJoin }),

  isPortrait: true,
  setIsPortrait: isPortrait => {
    useUiActions.getState().updateWidth();
    set({ isPortrait });
  },

  initMQTT: () => {
    const { user } = useUserStore.getState();
    mqtt.init(user, (reconnected, error) => {
      if (error) {
        logger.info(NAMESPACE, 'MQTT disconnected');
        set(() => ({ mqttReady: false }));
        alert('- Lost Connection to Arvut System -');
      } else if (reconnected) {
        set(() => ({ mqttReady: true }));
        logger.info(NAMESPACE, 'MQTT reconnected');
      }
      set(() => ({ mqttReady: true }));

      mqtt.join('galaxy/users/notification');
      mqtt.join('galaxy/users/broadcast');

      const { user } = useUserStore.getState();
      const { toggleCammute, toggleMute } = useMyStreamStore.getState();
      const { streamGalaxy } = useShidurStore.getState();
      const { toggleQuestion } = useSettingsStore.getState();
      const { updateDisplayById } = useInRoomStore.getState();
      const { restartRoom } = useInRoomStore.getState();

      mqtt.watch(data => {
        const { type, id, bitrate } = data;
        logger.debug(NAMESPACE, 'got message: ', data);

        if (user.id === id && CLIENT_RECONNECT_TYPES.includes(type)) {
          restartRoom();
        } else if (type === 'client-kicked' && user.id === id) {
          kc.logout();
        } else if (type === 'client-question' && user.id === id) {
          toggleQuestion();
        } else if (type === 'client-mute' && user.id === id) {
          toggleMute();
        } else if (type === 'video-mute' && user.id === id) {
          toggleCammute();
        } else if (type === 'audio-out') {
          logger.debug(NAMESPACE, 'audio-out: ', data);
          streamGalaxy(data.status);
          if (data.status) {
            // Remove question mark when sndman unmute our room
            toggleQuestion(false);
          }
        } else if (type === 'reload-config') {
          // this.reloadConfig();
        } else if (type === 'client-reload-all') {
          restartRoom();
        } else if (type === 'client-state') {
          updateDisplayById(data.user);
        }
      });
    });
  },

  endMqtt: async () => {
    await mqtt.end();
    set(() => ({ mqttReady: false, configReady: false }));
  },

  initConfig: async () => {
    useUserStore.getState().setGeoInfo();

    try {
      const configData = await api.fetchConfig();
      logger.debug(NAMESPACE, 'got config: ', configData);
      ConfigStore.setGlobalConfig(configData);
      GxyConfig.setGlobalConfig(configData);
      set(() => ({ configReady: true }));
    } catch (err) {
      logger.error(NAMESPACE, 'error initializing app', err);
    }
  },

  initApp: async () => {
    BackgroundTimer.start();
    let _isPlay = false;
    const uiLang = await getFromStorage('ui_lang', 'en');
    useSettingsStore.getState().setUiLang(uiLang);

    // Only add listener if eventEmitter is defined
    if (eventEmitter) {
      subscription = eventEmitter.addListener(
        'onCallStateChanged',
        async data => {
          const { exitRoom } = useInRoomStore.getState();

          if (data.state === 'ON_START_CALL') {
            _isPlay = useShidurStore.getState().isPlay;
            await exitRoom();
          } else if (data.state === 'ON_END_CALL') {
            _isPlay = useShidurStore.getState().setAutoPlay(_isPlay);
            useInitsStore.getState().setReadyForJoin(true);
          }
        }
      );
    }
  },

  terminateApp: () => {
    BackgroundTimer.stop();
    useSettingsStore.getState().toggleIsFullscreen(false);
    useChatStore.getState().setChatMode(modalModes.close);
    if (subscription) subscription.remove();
  },
}));
