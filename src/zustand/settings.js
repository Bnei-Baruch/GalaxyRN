// External libraries
import { create } from 'zustand';

// i18n

// Shared modules
import { getFromStorage } from '../shared/tools';

// Zustand stores
import logger from '../services/logger';
import { useInitsStore } from './inits';
import { useInRoomStore } from './inRoom';
import { useMyStreamStore } from './myStream';
import { useShidurStore } from './shidur';
import { useUiActions } from './uiActions';
import { useUserStore } from './user';

const NAMESPACE = 'Settings';

export const useSettingsStore = create((set, get) => ({
  autoEnterRoom: false,
  question: false,

  isFullscreen: false,
  toggleIsFullscreen: (isFullscreen = !get().isFullscreen) => {
    if (isFullscreen) {
      useInRoomStore.getState().feedAudioModeOn();
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
    if (!isShidur) {
      await useShidurStore.getState().cleanShidur(true);
    }
    set({ isShidur });
    useUiActions.getState().updateWidth(isShidur);
  },

  audioMode: false,
  toggleAudioMode: async (audioMode = !get().audioMode) => {
    audioMode ? get().enterAudioMode() : get().exitAudioMode();
    set({ audioMode });
  },

  enterAudioMode: async () => {
    logger.debug(NAMESPACE, 'enterAudioMode');
    try {
      useMyStreamStore.getState().toggleCammute(true, false);
      if (!useInitsStore.getState().readyForJoin) return;

      const { enterAudioMode, cleanQuads } = useShidurStore.getState();
      enterAudioMode();
      cleanQuads(false);
      useInRoomStore.getState().feedAudioModeOn();
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

      if (!useInitsStore.getState().readyForJoin) return;

      useShidurStore.getState().exitAudioMode();
    } catch (error) {
      logger.error(NAMESPACE, 'exitAudioMode error', error);
    }
  },

  showGroups: false,
  toggleShowGroups: () => set(state => ({ showGroups: !state.showGroups })),

  hideSelf: false,
  toggleHideSelf: () => set(state => ({ hideSelf: !state.hideSelf })),

  netWIP: false,
  setNetWIP: netWIP => set({ netWIP }),
}));
