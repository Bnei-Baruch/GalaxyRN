import { create } from 'zustand';

import { STORAGE_KEYS } from '../constants';
import logger from '../services/logger';
import { setToStorage } from '../tools';
import { useFeedsStore } from './feeds';
import { useInRoomStore } from './inRoom';
import { useShidurStore } from './shidur';
import { useUiActions } from './uiActions';
import { useUserStore } from './user';

const NAMESPACE = 'settings';

export const useSettingsStore = create((set, get) => ({
  autoEnterRoom: false,
  question: false,

  isFullscreen: false,
  toggleIsFullscreen: (isFullscreen = !get().isFullscreen) => {
    if (isFullscreen) {
      useFeedsStore.getState().feedAudioModeOn();
    }
    set({ isFullscreen });
  },

  toggleQuestion: (question = !get().question) => {
    useUserStore.getState().sendUserState({ question });
    set({ question });
  },

  isShidur: true,
  toggleIsShidur: async () => {
    const isShidur = !get().isShidur;
    logger.debug(NAMESPACE, 'toggleIsShidur', isShidur);
    if (!isShidur) {
      await useShidurStore.getState().cleanShidur();
    } else {
      await useShidurStore.getState().prepareShidur();
    }
    set({ isShidur });
    useUiActions.getState().updateWidth(isShidur);
  },

  audioMode: false,
  toggleAudioMode: async (audioMode = !get().audioMode) => {
    logger.debug(NAMESPACE, 'toggleAudioMode', audioMode);
    try {
      audioMode
        ? useInRoomStore.getState().enterAudioMode()
        : useInRoomStore.getState().exitAudioMode();
    } catch (error) {
      logger.error(NAMESPACE, 'Error during toggleAudioMode:', error);
    }
    setToStorage(STORAGE_KEYS.IS_AUDIO_MODE, audioMode.toString());
    logger.debug(NAMESPACE, 'toggleAudioMode done', audioMode);
    set({ audioMode });
  },

  showGroups: false,
  toggleShowGroups: () => set(state => ({ showGroups: !state.showGroups })),

  hideSelf: false,
  toggleHideSelf: () => set(state => ({ hideSelf: !state.hideSelf })),

  netWIP: false,
  setNetWIP: netWIP => set({ netWIP }),
  debugMode: false,
  toggleDebugMode: () => {
    set(state => ({ debugMode: !state.debugMode }));
    setIsDebug(state.debugMode);
  },
}));
