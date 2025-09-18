import { create } from 'zustand';
import AudioBridge from '../services/AudioBridge';
import WakeLockBridge from '../services/WakeLockBridge';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';

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
    if (get().isInRoom) {
      logger.debug(NAMESPACE, 'already in room');
      return;
    }

    if (attempts > 2) {
      get().exitRoom();
      alert('Could not connect to the server, please try again later');
      attempts = 0;
      return;
    }

    attempts++;
    set({ isInRoom: true });

    try {
      AudioBridge.requestAudioFocus();
      await WakeLockBridge.keepScreenOn();
      useMyStreamStore.getState().toggleMute(true);
      set({ isInBackground: false });
    } catch (error) {
      logger.error(NAMESPACE, 'audio focus or keeping screen on', error);
      return get().exitRoom();
    }

    try {
      Promise.all([
        useFeedsStore.getState().initFeeds(),
        useShidurStore.getState().initShidur(isPlay),
      ]);
    } catch (error) {
      logger.error(NAMESPACE, 'Error initializing shidur and feeds', error);
      return get().restartRoom();
    }
    const { room } = useRoomStore.getState();
    try {
      Promise.all([
        mqtt.sub(`galaxy/room/${room.room}`),
        mqtt.sub(`galaxy/room/${room.room}/chat`, { qos: 0, nl: false }),
      ]);
    } catch (error) {
      logger.error(NAMESPACE, 'Error joining MQTT rooms', error);
    }
    attempts = 0;
  },

  exitRoom: async () => {
    logger.debug(NAMESPACE, 'exitRoom exitWIP');
    if (exitWIP || !get().isInRoom) {
      logger.debug(NAMESPACE, 'already exiting room');
      return;
    }

    exitWIP = true;
    try {
      await Promise.all([
        useShidurStore.getState().cleanJanus(),
        useFeedsStore.getState().cleanFeeds(),
      ]);
    } catch (error) {
      logger.error(NAMESPACE, 'Error cleaning shidur janus', error);
    }

    try {
      useChatStore.getState().cleanCounters();
      useChatStore.getState().cleanMessages();

      const { room } = useRoomStore.getState();
      logger.debug(NAMESPACE, 'exitRoom room', room);
      await Promise.all([
        mqtt.exit(`galaxy/room/${room.room}`),
        mqtt.exit(`galaxy/room/${room.room}/chat`),
      ]);
    } catch (error) {
      logger.error(NAMESPACE, 'Error exiting mqtt rooms', error);
    }

    logger.debug(NAMESPACE, 'exitRoom AudioBridge.abandonAudioFocus()');
    try {
      AudioBridge.abandonAudioFocus();
      WakeLockBridge.releaseScreenOn();
    } catch (error) {
      logger.error(NAMESPACE, 'Error cleaning up device states', error);
    }

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
    set({ isInBackground: true });
    get().enterAudioMode();
  },

  enterForeground: async () => {
    set({ isInBackground: false });
    if (!useSettingsStore.getState().audioMode) {
      get().exitAudioMode();
    }
  },

  enterAudioMode: async () => {
    logger.debug(NAMESPACE, 'enterAudioMode');
    try {
      useMyStreamStore.getState().toggleCammute(true, false);
      if (!get().isInRoom) return;

      const { enterAudioMode, cleanQuads } = useShidurStore.getState();
      enterAudioMode();
      cleanQuads(false);
      useFeedsStore.getState().feedAudioModeOn();
    } catch (error) {
      logger.error(NAMESPACE, 'enterAudioMode error', error);
    }
  },

  exitAudioMode: async () => {
    logger.debug(NAMESPACE, 'exitAudioMode');

    try {
      const cammute = await getFromStorage('cammute', false).then(
        x => x === 'true'
      );
      useMyStreamStore.getState().toggleCammute(cammute);

      if (!get().isInRoom) return;

      useShidurStore.getState().exitAudioMode();
    } catch (error) {
      logger.error(NAMESPACE, 'exitAudioMode error', error);
    }
  },
}));
