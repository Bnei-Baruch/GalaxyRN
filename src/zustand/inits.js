// External libraries
import BackgroundTimer from 'react-native-background-timer';
import { create } from 'zustand';

// React Native modules

// Services
import CallsBridge from '../services/CallsBridge';
import logger from '../services/logger';
import { sleep } from '../shared/tools';

// Auth
import kc from '../auth/keycloak';

// Shared modules
import api from '../shared/Api';
import ConfigStore from '../shared/ConfigStore';
import GxyConfig from '../shared/janus-config';
import mqtt from '../shared/mqtt';

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

// Safely create event emitter using the bridge's method
let eventEmitter;
try {
  eventEmitter = CallsBridge.getEventEmitter();
  logger.debug(NAMESPACE, 'eventEmitter created successfully:', eventEmitter);
} catch (error) {
  logger.error(NAMESPACE, 'Error setting up event emitter:', error);
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

  initMQTT: async () => {
    const { user } = useUserStore.getState();
    const { restartRoom, exitRoom } = useInRoomStore.getState();

    try {
      await mqtt.init();
      logger.debug(NAMESPACE, 'MQTT initialized');
      await mqtt.join('galaxy/users/notification');
      await mqtt.join('galaxy/users/broadcast');
      set(() => ({ mqttReady: true }));
    } catch (error) {
      logger.error(NAMESPACE, 'Error initializing MQTT:', error);
      restartRoom();
      return;
    }

    const { toggleCammute, toggleMute } = useMyStreamStore.getState();
    const { streamGalaxy } = useShidurStore.getState();
    const { toggleQuestion } = useSettingsStore.getState();
    const { updateDisplayById } = useInRoomStore.getState();

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
  },

  abortMqtt: async () => {
    logger.debug(NAMESPACE, 'abortMqtt');

    try {
      // First unsubscribe from topics
      if (mqtt.mq && mqtt.mq.connected) {
        await mqtt
          .exit('galaxy/users/notification')
          .catch(err =>
            logger.error(NAMESPACE, 'Error exiting notification topic:', err)
          );
        await mqtt
          .exit('galaxy/users/broadcast')
          .catch(err =>
            logger.error(NAMESPACE, 'Error exiting broadcast topic:', err)
          );
      }

      await sleep(100);

      if (mqtt.mq) {
        logger.debug(NAMESPACE, 'ending MQTT connection');
        await mqtt
          .end()
          .catch(err =>
            logger.error(NAMESPACE, 'Error ending MQTT connection:', err)
          );
      }
    } catch (error) {
      logger.error(NAMESPACE, 'Error in MQTT cleanup:', error);
    }

    set(() => ({ mqttReady: false, configReady: false }));
    logger.debug(NAMESPACE, 'abortMqtt done');
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
    logger.debug(NAMESPACE, 'initApp eventEmitter', eventEmitter);
    try {
      subscription = eventEmitter.addListener(
        'onCallStateChanged',
        async data => {
          logger.debug(NAMESPACE, 'onCallStateChanged EVENT RECEIVED:', data);

          if (data.state === 'ON_START_CALL') {
            logger.debug(NAMESPACE, 'Processing ON_START_CALL');
            _isPlay = useShidurStore.getState().isPlay;
            logger.debug(NAMESPACE, 'ON_START_CALL exitRoom');
            await useInRoomStore.getState().exitRoom();
            logger.debug(NAMESPACE, 'ON_START_CALL processing completed');
          } else if (data.state === 'ON_END_CALL') {
            logger.debug(NAMESPACE, 'Processing ON_END_CALL');
            useShidurStore.getState().setAutoPlay(_isPlay);
            useInitsStore.getState().setReadyForJoin(true);
            logger.debug(NAMESPACE, 'ON_END_CALL processing completed');
          } else {
            logger.debug(NAMESPACE, 'Unhandled call state:', data.state);
          }
        }
      );
    } catch (error) {
      logger.error(NAMESPACE, 'Error initializing app', error);
    }
  },

  terminateApp: () => {
    logger.debug(NAMESPACE, 'terminateApp');
    BackgroundTimer.stop();
    useSettingsStore.getState().toggleIsFullscreen(false);
    useChatStore.getState().setChatMode(modalModes.close);
    useUserStore.getState().setVhinfo(null);
    if (subscription) {
      logger.debug(NAMESPACE, 'remove event listener');
      subscription.remove();
    }
  },
}));
