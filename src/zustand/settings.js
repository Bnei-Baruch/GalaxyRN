import { create } from 'zustand';

import logger from '../services/logger';
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
      await useShidurStore.getState().initShidur();
    }
    set({ isShidur });
    useUiActions.getState().updateWidth(isShidur);
  },

  audioMode: false,
  toggleAudioMode: async (audioMode = !get().audioMode) => {
    audioMode
      ? useInRoomStore.getState().enterAudioMode()
      : useInRoomStore.getState().exitAudioMode();
    set({ audioMode });
  },

  showGroups: false,
  toggleShowGroups: () => set(state => ({ showGroups: !state.showGroups })),

  hideSelf: false,
  toggleHideSelf: () => set(state => ({ hideSelf: !state.hideSelf })),

  netWIP: false,
  setNetWIP: netWIP => set({ netWIP }),
}));
