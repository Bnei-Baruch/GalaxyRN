import { create } from 'zustand';
import { useMyStreamStore } from './myStream';
import { useShidurStore } from './shidur';
import { deactivateFeedsVideos, useInRoomStore, activateFeedsVideos } from './inRoom';
import { useUserStore } from './user';
import { getFromStorage } from '../shared/tools';
import { useUiActions } from './uiActions';
import { useInitsStore } from './inits';

export const useSettingsStore = create((set, get) => ({
  uiLang            : 'en',
  autoEnterRoom     : false,
  changeUiLang      : (lang) => set({ uiLang: lang }),
  question          : false,
  isFullscreen      : false,
  toggleIsFullscreen: () => {
    const isFullscreen = !get().isFullscreen;
    useUiActions.getState().toggleShowBars(isFullscreen);
    useShidurStore.getState().toggleShidurBar(false, !isFullscreen);
    set({ isFullscreen });
  },
  toggleQuestion    : (question = !get().question) => {
    useUserStore.getState().sendUserState({ question });
    set({ question });
  },
  isShidur          : true,
  toggleIsShidur    : () => {
    const isShidur = !get().isShidur;
    !isShidur && useShidurStore.getState().cleanShidur();
    useUiActions.getState().updateWidth(isShidur);
    set({ isShidur });
  },
  audioMode         : false,
  toggleAudioMode   : async (audioMode = !get().audioMode) => {
    audioMode ? get().enterAudioMode() : get().exitAudioMode();
    set({ audioMode });
  },
  enterAudioMode    : async () => {
    useMyStreamStore.getState().toggleCammute(true, false);
    if (!useInitsStore.getState().readyForJoin)
      return;
    const feeds = Object.values(useInRoomStore.getState().feedById);
    deactivateFeedsVideos(feeds);

    const { enterAudioMode, cleanQuads } = useShidurStore.getState();
    enterAudioMode();
    cleanQuads(false);
  },
  exitAudioMode     : async () => {
    const cammute = await getFromStorage('cammute', false).then(x => x === 'true');
    useMyStreamStore.getState().toggleCammute(cammute);

    if (!useInitsStore.getState().readyForJoin)
      return;

    const feeds = Object.values(useInRoomStore.getState().feedById);
    activateFeedsVideos(feeds);

    const { initShidur, initQuad } = useShidurStore.getState();
    initShidur();
    initQuad();
  },
  showGroups        : false,
  toggleShowGroups  : () => set((state) => ({ showGroups: !state.showGroups })),
  hideSelf          : false,
  toggleHideSelf    : () => set((state) => ({ hideSelf: !state.hideSelf })),
}));