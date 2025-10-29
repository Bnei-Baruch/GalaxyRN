import { create } from 'zustand';
import AudioBridge from '../services/AudioBridge';
import WakeLockBridge from '../services/WakeLockBridge';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';

import { ROOM_SESSION } from '../libs/sentry/constants';
import {
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

    const { room } = useRoomStore.getState();

    // Start Sentry transaction at the very beginning of joinRoom
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
      finishSpan(deviceSpan, 'ok');
    } catch (error) {
      logger.error(NAMESPACE, 'audio focus or keeping screen on', error);
      finishSpan(deviceSpan, 'internal_error');
      finishTransaction(ROOM_SESSION, 'internal_error');
      return get().exitRoom();
    }

    const janusInitSpan = addSpan(ROOM_SESSION, 'janus.inits');

    try {
      await Promise.all([
        useFeedsStore.getState().initFeeds(),
        useShidurStore.getState().initShidur(isPlay),
      ]);
      finishSpan(janusInitSpan, 'ok');
    } catch (error) {
      logger.error(NAMESPACE, 'Error initializing shidur and feeds', error);
      finishSpan(janusInitSpan, 'internal_error');
      finishTransaction(ROOM_SESSION, 'internal_error');
      return get().restartRoom();
    }

    // Step 3: Subscribe to MQTT topics
    const mqttSubscribeSpan = addSpan(ROOM_SESSION, 'mqtt.subscribe');

    try {
      await Promise.all([
        mqtt.sub(`galaxy/room/${room.room}`),
        mqtt.sub(`galaxy/room/${room.room}/chat`, { qos: 0, nl: false }),
      ]);
      finishSpan(mqttSubscribeSpan, 'ok');
    } catch (error) {
      logger.error(NAMESPACE, 'Error joining MQTT rooms', error);
      finishSpan(mqttSubscribeSpan, 'internal_error');
    }

    attempts = 0;
    // Note: Transaction will be finished when exitRoom is called
  },

  exitRoom: async () => {
    logger.debug(NAMESPACE, 'exitRoom exitWIP');
    if (exitWIP || !get().isInRoom) {
      logger.debug(NAMESPACE, 'already exiting room');
      return;
    }

    exitWIP = true;

    // Step 1: Clean Janus connections
    const janusCleanupSpan = addSpan(ROOM_SESSION, 'janus.cleanup');

    try {
      await Promise.all([
        useShidurStore.getState().cleanJanus(),
        useFeedsStore.getState().cleanFeeds(),
      ]);
      finishSpan(janusCleanupSpan, 'ok');
    } catch (error) {
      logger.error(NAMESPACE, 'Error cleaning shidur janus', error);
      finishSpan(janusCleanupSpan, 'internal_error');
    }

    // Step 2: Clean chat and unsubscribe from MQTT
    const mqttCleanupSpan = addSpan(ROOM_SESSION, 'mqtt.cleanup');

    try {
      useChatStore.getState().cleanCounters();
      useChatStore.getState().cleanMessages();

      const { room } = useRoomStore.getState();
      logger.debug(NAMESPACE, 'exitRoom room', room);
      await Promise.all([
        mqtt.exit(`galaxy/room/${room.room}`),
        mqtt.exit(`galaxy/room/${room.room}/chat`),
      ]);
      finishSpan(mqttCleanupSpan, 'ok');
    } catch (error) {
      logger.error(NAMESPACE, 'Error exiting mqtt rooms', error);
      finishSpan(mqttCleanupSpan, 'internal_error');
    }

    // Step 3: Release device resources
    const deviceCleanupSpan = addSpan(ROOM_SESSION, 'device.cleanup');

    logger.debug(NAMESPACE, 'exitRoom AudioBridge.abandonAudioFocus()');
    try {
      AudioBridge.abandonAudioFocus();
      WakeLockBridge.releaseScreenOn();
      finishSpan(deviceCleanupSpan, 'ok');
    } catch (error) {
      logger.error(NAMESPACE, 'Error cleaning up device states', error);
      finishSpan(deviceCleanupSpan, 'internal_error');
    }

    // Finish the room session transaction
    finishTransaction(ROOM_SESSION, 'ok');

    exitWIP = false;
    set({ isInRoom: false });
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
    const span = addSpan(ROOM_SESSION, 'background');
    set({ isInBackground: true });
    get().enterAudioMode();
    finishSpan(span, 'ok');
  },

  enterForeground: async () => {
    const span = addSpan(ROOM_SESSION, 'foreground');
    set({ isInBackground: false });
    if (!useSettingsStore.getState().audioMode) {
      get().exitAudioMode();
    }
    finishSpan(span, 'ok');
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
      finishSpan(span, 'internal_error');
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
      finishSpan(span, 'ok');
    } catch (error) {
      logger.error(NAMESPACE, 'exitAudioMode error', error);
      finishSpan(span, 'internal_error');
    }
  },
}));
