// External libraries
import { create } from 'zustand';

// i18n
import { setLanguage } from '../i18n/i18n';

// Shared modules
import { getFromStorage, setToStorage } from '../shared/tools';

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
  uiLang: 'en',
  autoEnterRoom: false,

  setUiLang: uiLang => {
    set({ uiLang });
    setLanguage(uiLang);
    setToStorage('ui_lang', uiLang);
  },

  question: false,

  isFullscreen: false,
  toggleIsFullscreen: (isFullscreen = !get().isFullscreen) =>
    set({ isFullscreen }),

  toggleQuestion: (question = !get().question) => {
    useUserStore.getState().sendUserState({ question });
    set({ question });
  },

  isShidur: true,
  toggleIsShidur: () => {
    const isShidur = !get().isShidur;
    !isShidur && useShidurStore.getState().cleanShidur(true);
    useUiActions.getState().updateWidth(isShidur);
    set({ isShidur });
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

      const ids = Object.keys(useInRoomStore.getState().feedById);
      await useInRoomStore.getState().deactivateFeedsVideos(ids);
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

      const { initShidur, initQuad } = useShidurStore.getState();
      initShidur();
      initQuad();
    } catch (error) {
      logger.error(NAMESPACE, 'exitAudioMode error', error);
    }
  },

  showGroups: false,
  toggleShowGroups: () => set(state => ({ showGroups: !state.showGroups })),

  hideSelf: false,
  toggleHideSelf: () => set(state => ({ hideSelf: !state.hideSelf })),
}));
