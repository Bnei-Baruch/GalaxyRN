// External libraries
import { create } from 'zustand';

// i18n
import { setLanguage } from '../i18n/i18n';

// Shared modules
import { getFromStorage, setToStorage } from '../shared/tools';

// Zustand stores
import { useInitsStore } from './inits';
import {
  activateFeedsVideos,
  deactivateFeedsVideos,
  useInRoomStore,
} from './inRoom';
import { useMyStreamStore } from './myStream';
import { useShidurStore } from './shidur';
import { useUiActions } from './uiActions';
import { useUserStore } from './user';

// Keep reference to listener so we can remove it when needed
let orientationListener = null;

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
    useMyStreamStore.getState().toggleCammute(true, false);
    if (!useInitsStore.getState().readyForJoin) return;

    const feeds = Object.values(useInRoomStore.getState().feedById);
    deactivateFeedsVideos(feeds);

    const { enterAudioMode, cleanQuads } = useShidurStore.getState();
    enterAudioMode();
    cleanQuads(false);
  },

  exitAudioMode: async () => {
    const cammute = await getFromStorage('cammute', false).then(
      x => x === 'true'
    );
    useMyStreamStore.getState().toggleCammute(cammute);

    if (!useInitsStore.getState().readyForJoin) return;

    const feeds = Object.values(useInRoomStore.getState().feedById);
    activateFeedsVideos(feeds);

    const { initShidur, initQuad } = useShidurStore.getState();
    initShidur();
    initQuad();
  },

  showGroups: false,
  toggleShowGroups: () => set(state => ({ showGroups: !state.showGroups })),

  hideSelf: false,
  toggleHideSelf: () => set(state => ({ hideSelf: !state.hideSelf })),
}));
