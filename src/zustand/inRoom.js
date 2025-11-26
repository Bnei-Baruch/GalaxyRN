import { create } from 'zustand';
import AudioBridge from '../services/AudioBridge';
import WakeLockBridge from '../services/WakeLockBridge';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';
import { rejectTimeoutPromise } from '../shared/tools';

import { ROOM_SESSION } from '../libs/sentry/constants';
import {
  addFinishSpan,
  addSpan,
  finishSpan,
  finishTransaction,
  startTransaction,
} from '../libs/sentry/sentryHelper';
import { getFromStorage } from '../shared/tools';
import { useChatStore } from './chat';
import { useFeedsStore } from './feeds';
import useRoomStore from './fetchRooms';
import { useMyStreamStore } from './myStream';
import { useSettingsStore } from './settings';
import { useShidurStore } from './shidur';

const NAMESPACE = 'InRoom';

let attempts = 0;
let restartWIP = false;
let exitWIP = false;

export const useInRoomStore = create((set, get) => ({
  isInBackground: false,
  isInRoom: false,
  setIsInRoom: (isInRoom = true) => set({ isInRoom }),

  joinRoom: async (isPlay = false) => {
    logger.debug(NAMESPACE, 'joinRoom', isPlay);

    startTransaction(ROOM_SESSION, 'Join Room', 'navigation');

    // Early exit checks
    if (get().isInRoom) {
      logger.debug(NAMESPACE, 'already in room');
      finishTransaction(ROOM_SESSION, 'duplicate');
      return;
    }

    if (attempts > 2) {
      logger.warn(NAMESPACE, 'too many attempts, aborting');
      finishTransaction(ROOM_SESSION, 'aborted');
      get().exitRoom();
      alert('Could not connect to the server, please try again later');
      attempts = 0;
      return;
    }

    attempts++;
    set({ isInRoom: true });

    const deviceSpan = addSpan(ROOM_SESSION, 'device.setup');

    try {
      AudioBridge.requestAudioFocus();
      await WakeLockBridge.keepScreenOn();
      useMyStreamStore.getState().toggleMute(true);
      finishSpan(deviceSpan, 'ok', NAMESPACE);
    } catch (error) {
      logger.error(NAMESPACE, 'audio focus or keeping screen on', error);
      finishSpan(deviceSpan, 'internal_error', NAMESPACE);
      finishTransaction(ROOM_SESSION, 'internal_error');
      return get().exitRoom();
    }

    const janusInitSpan = addSpan(ROOM_SESSION, 'janus.inits');

    try {
      await Promise.all([
        useFeedsStore.getState().initFeeds(),
        useShidurStore.getState().initShidur(isPlay),
      ]);
      finishSpan(janusInitSpan, 'ok', NAMESPACE);
    } catch (error) {
      logger.error(NAMESPACE, 'Error initializing shidur and feeds', error);
      finishSpan(janusInitSpan, 'internal_error', NAMESPACE);
      finishTransaction(ROOM_SESSION, 'internal_error');
      return get().restartRoom();
    }

    try {
      get().subscribeMqtt();
    } catch (error) {
      return get().restartRoom();
    }

    attempts = 0;
    // Note: Transaction will be finished when exitRoom is called
  },

  subscribeMqtt: async () => {
    logger.debug(NAMESPACE, 'subscribeMqtt');
    const { room } = useRoomStore.getState();
    const mqttSubscribeSpan = addSpan(ROOM_SESSION, 'mqtt.subscribe');
    try {
      await Promise.all([
        mqtt.sub(`galaxy/room/${room.room}`),
        mqtt.sub(`galaxy/room/${room.room}/chat`, { qos: 0, nl: false }),
      ]);
      finishSpan(mqttSubscribeSpan, 'ok', NAMESPACE);
    } catch (error) {
      logger.error(NAMESPACE, 'Error subscribing to MQTT rooms', error);
      finishSpan(mqttSubscribeSpan, 'internal_error', NAMESPACE);
      throw error;
    }
  },

  exitRoom: async () => {
    logger.debug(NAMESPACE, 'exitRoom exitWIP');
    if (exitWIP || !get().isInRoom) {
      logger.debug(NAMESPACE, 'already exiting room');
      return;
    }

    exitWIP = true;
    try {
      await rejectTimeoutPromise(get().exitNetResources(), 5000);
    } catch (error) {
      logger.error(NAMESPACE, 'Error during exitNetResources:', error);
    }

    const deviceCleanupSpan = addSpan(ROOM_SESSION, 'device.cleanup', {
      NAMESPACE,
    });

    logger.debug(NAMESPACE, 'exitRoom AudioBridge.abandonAudioFocus()');
    try {
      AudioBridge.abandonAudioFocus();
      WakeLockBridge.releaseScreenOn();
      finishSpan(deviceCleanupSpan, 'ok', NAMESPACE);
    } catch (error) {
      logger.error(NAMESPACE, 'Error cleaning up device states', error);
      finishSpan(deviceCleanupSpan, 'internal_error', NAMESPACE);
    }

    // Finish the room session transaction
    finishTransaction(ROOM_SESSION, 'ok', NAMESPACE);

    exitWIP = false;
    set({ isInRoom: false });
  },

  exitNetResources: async () => {
    // Step 1: Clean Janus connections
    const janusCleanupSpan = addSpan(ROOM_SESSION, 'janus.cleanup', {
      NAMESPACE,
    });

    try {
      await Promise.all([
        useShidurStore.getState().cleanJanus(),
        useFeedsStore.getState().cleanFeeds(),
      ]);
      finishSpan(janusCleanupSpan, 'ok', NAMESPACE);
    } catch (error) {
      logger.error(NAMESPACE, 'Error cleaning shidur janus', error);
      finishSpan(janusCleanupSpan, 'internal_error', NAMESPACE);
    }

    // Step 2: Clean chat and unsubscribe from MQTT
    const mqttCleanupSpan = addSpan(ROOM_SESSION, 'mqtt.cleanup', {
      NAMESPACE,
    });

    try {
      useChatStore.getState().cleanCounters();
      useChatStore.getState().cleanMessages();

      const { room } = useRoomStore.getState();
      logger.debug(NAMESPACE, 'exitRoom room', room);
      await Promise.all([
        mqtt.exit(`galaxy/room/${room.room}`),
        mqtt.exit(`galaxy/room/${room.room}/chat`),
      ]);
      finishSpan(mqttCleanupSpan, 'ok', NAMESPACE);
    } catch (error) {
      logger.error(NAMESPACE, 'Error exiting mqtt rooms', error);
      finishSpan(mqttCleanupSpan, 'internal_error');
    }
    return true;
  },

  restartRoom: async () => {
    logger.debug(NAMESPACE, 'useInRoomStore restartRoom', restartWIP);

    if (restartWIP || exitWIP) return;

    restartWIP = true;
    const _isPlay = useShidurStore.getState().isPlay;
    try {
      await get().exitRoom();
      await get().joinRoom(_isPlay);
    } catch (error) {
      await get().exitRoom();
      logger.error(NAMESPACE, 'Error restarting room', error);
    }
    restartWIP = false;
  },

  enterBackground: async () => {
    set({ isInBackground: true });
    get().enterAudioMode();
    addFinishSpan(ROOM_SESSION, 'background', { NAMESPACE });
  },

  enterForeground: async () => {
    set({ isInBackground: false });
    if (!useSettingsStore.getState().audioMode) {
      get().exitAudioMode();
    }
    addFinishSpan(ROOM_SESSION, 'foreground', { NAMESPACE });
  },

  enterAudioMode: async () => {
    logger.debug(NAMESPACE, 'enterAudioMode');
    const span = addSpan(ROOM_SESSION, 'audioMode.enter');
    try {
      useMyStreamStore.getState().toggleCammute(true, false);
      finishSpan(span, 'ok');
      if (!get().isInRoom) return;

      const { enterAudioMode, cleanQuads } = useShidurStore.getState();
      enterAudioMode();
      cleanQuads(false);
      useFeedsStore.getState().feedAudioModeOn();
    } catch (error) {
      logger.error(NAMESPACE, 'enterAudioMode error', error);
      finishSpan(span, 'internal_error', NAMESPACE);
    }
  },

  exitAudioMode: async () => {
    logger.debug(NAMESPACE, 'exitAudioMode');
    const span = addSpan(ROOM_SESSION, 'audioMode.exit');
    try {
      const cammute = await getFromStorage('cammute', false).then(
        x => x === 'true'
      );
      useMyStreamStore.getState().toggleCammute(cammute);

      if (!get().isInRoom) return;

      useShidurStore.getState().exitAudioMode();
      finishSpan(span, 'ok', NAMESPACE);
    } catch (error) {
      logger.error(NAMESPACE, 'exitAudioMode error', error);
      finishSpan(span, 'internal_error', NAMESPACE);
    }
  },
}));
