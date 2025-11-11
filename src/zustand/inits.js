import { DeviceEventEmitter, Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { create } from 'zustand';
import kc from '../auth/keycloak';
import CallsBridge from '../services/CallsBridge';
import logger from '../services/logger';
import api from '../shared/Api';
import ConfigStore from '../shared/ConfigStore';
import GxyConfig from '../shared/janus-config';
import mqtt from '../shared/mqtt';

import { ROOM_SESSION } from '../libs/sentry/constants';
import { addFinishSpan } from '../libs/sentry/sentryHelper';
import { useChatStore } from './chat';
import { useFeedsStore } from './feeds';
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
  permReady: false,
  setPermReady: (permReady = true) => set({ permReady }),
  isAppInited: false,
  setIsAppInited: (isAppInited = true) => set({ isAppInited }),

  netIsOn: true,
  setNetIsOn: (netIsOn = true) => set({ netIsOn }),

  mqttIsOn: false,
  setMqttIsOn: (mqttIsOn = true) => set({ mqttIsOn }),

  configReady: false,

  setIsPortrait: isPortrait => {
    if (get().isPortrait !== isPortrait) {
      useUiActions.getState().updateWidth();
      set({ isPortrait });
    }
  },

  initMQTT: async () => {
    const { user } = useUserStore.getState();
    const { restartRoom } = useInRoomStore.getState();

    try {
      await mqtt.init();
      logger.debug(NAMESPACE, 'MQTT initialized');
      set({ mqttIsOn: true });
    } catch (error) {
      logger.error(NAMESPACE, 'Error initializing MQTT:', error);
      get().abortMqtt();
      return;
    }

    try {
      get().subscribeMqtt();
    } catch (error) {
      get().abortMqtt();
      return;
    }

    const { toggleCammute, toggleMute } = useMyStreamStore.getState();
    const { streamGalaxy } = useShidurStore.getState();
    const { toggleQuestion } = useSettingsStore.getState();
    const { updateDisplayById } = useFeedsStore.getState();

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
  subscribeMqtt: async () => {
    try {
      await Promise.all([
        mqtt.sub('galaxy/users/notification'),
        mqtt.sub('galaxy/users/broadcast'),
        mqtt.sub('mobile/releases', { rap: true }),
      ]);
    } catch (error) {
      logger.error(NAMESPACE, 'Error subscribing to MQTT topics:', error);
      throw error;
    }
  },

  abortMqtt: async () => {
    logger.debug(NAMESPACE, 'abortMqtt');

    if (mqtt.mq) {
      try {
        await Promise.all([
          mqtt.exit('galaxy/users/notification'),
          mqtt.exit('galaxy/users/broadcast'),
          mqtt.exit('mobile/releases'),
        ]);
      } catch (err) {
        logger.error(NAMESPACE, 'Error exiting MQTT topics:', err);
      }

      try {
        await mqtt.end();
        logger.debug(NAMESPACE, 'MQTT connection ended');
      } catch (err) {
        logger.error(NAMESPACE, 'Error ending MQTT connection:', err);
      }
    }

    set(() => ({ mqttIsOn: false }));
    logger.debug(NAMESPACE, 'abortMqtt done');
  },

  initConfig: async () => {
    logger.debug(NAMESPACE, 'initConfig');
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
    logger.debug(NAMESPACE, 'initConfig done');
  },

  initApp: async () => {
    logger.debug(NAMESPACE, 'initApp');
    BackgroundTimer.start();
    let _isPlay = false;
    if (Platform.OS === 'android') {
      terminateSubscription = DeviceEventEmitter.addListener(
        'appTerminating',
        async event => {
          logger.debug(NAMESPACE, 'appTerminating event: ', event);
          logger.debug(NAMESPACE, 'appTerminating');
          await useInRoomStore.getState().exitRoom();
          await useInitsStore.getState().abortMqtt();
          await useInitsStore.getState().terminateApp();
          terminateSubscription.remove();
          terminateSubscription = null;
        }
      );
      logger.debug(NAMESPACE, 'appTerminating listener set up successfully');
    }
    logger.debug(NAMESPACE, 'initApp eventEmitter', eventEmitter);

    try {
      subscription = eventEmitter.addListener(
        'onCallStateChanged',
        async data => {
          logger.debug(NAMESPACE, 'onCallStateChanged EVENT RECEIVED:', data);
          addFinishSpan(ROOM_SESSION, 'onCallStateChanged', {
            ...data,
            NAMESPACE,
          });

          if (data.state === 'ON_START_CALL') {
            logger.debug(NAMESPACE, 'Processing ON_START_CALL');
            _isPlay = useShidurStore.getState().isPlay;
            logger.debug(NAMESPACE, 'ON_START_CALL exitRoom');
            await useInRoomStore.getState().exitRoom();
            logger.debug(NAMESPACE, 'ON_START_CALL processing completed');
          } else if (data.state === 'ON_END_CALL') {
            logger.debug(NAMESPACE, 'Processing ON_END_CALL');
            useShidurStore.getState().initShidur(_isPlay);
            useInRoomStore.getState().joinRoom();
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
    logger.debug(NAMESPACE, 'terminateApp - starting comprehensive cleanup');

    try {
      BackgroundTimer.stop();

      logger.debug(NAMESPACE, 'BackgroundTimer stopped successfully');
    } catch (error) {
      logger.error(NAMESPACE, 'Error stopping BackgroundTimer', error);
    }

    try {
      useSettingsStore.getState().toggleIsFullscreen(false);
      useChatStore.getState().setChatMode(modalModes.close);
      useUserStore.getState().setVhinfo(null);

      if (subscription) {
        logger.debug(NAMESPACE, 'remove event listener');
        subscription.remove();
        subscription = null;
      }

      logger.debug(NAMESPACE, 'terminateApp completed successfully');
    } catch (error) {
      logger.error(NAMESPACE, 'Error during app termination cleanup', error);
    }
  },
}));
