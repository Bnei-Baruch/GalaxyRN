import { create } from 'zustand';
import { useMyStreamStore } from './myStream';
import { useShidurStore } from './shidur';
import { deactivateFeedsVideos, useInRoomStore, activateFeedsVideos } from './inRoom';
import { useUserStore } from './user';
import { getFromStorage } from '../shared/tools';

export const useSettingsStore = create((set, get) => ({
  uiLang          : 'en',
  autoEnterRoom   : false,
  changeUiLang    : (lang) => set({ uiLang: lang }),
  readyForJoin    : false,
  setReadyForJoin : (readyForJoin = true) => set({ readyForJoin }),
  question        : false,
  toggleQuestion  : () => {
    const question = !get().question;
    useUserStore.getState().sendUserState({ question });
    set({ question });
  },
  isShidur        : true,
  toggleIsShidur  : () => {
    const isShidur = !get().isShidur;
    !isShidur && useShidurStore.getState().cleanShidur();
    set({ isShidur });
  },
  audioMode       : false,
  toggleAudioMode : async (audioMode = !get().audioMode) => {
    audioMode ? get().enterAudioMode() : get().exitAudioMode();
    set({ audioMode });
  },
  enterAudioMode  : async () => {
    useMyStreamStore.getState().toggleCammute(true, false);

    const feeds = Object.values(useInRoomStore.getState().feedById);
    deactivateFeedsVideos(feeds);

    const { enterAudioMode, cleanQuads } = useShidurStore.getState();
    enterAudioMode();
    cleanQuads(false);
  },
  exitAudioMode   : async () => {
    const cammute = await getFromStorage('cammute', false).then(x => x === 'true');
    useMyStreamStore.getState().toggleCammute(cammute);

    const feeds = Object.values(useInRoomStore.getState().feedById);
    activateFeedsVideos(feeds);

    const { initShidur, initQuad } = useShidurStore.getState();
    initShidur();
    initQuad();
  },
  showGroups      : false,
  toggleShowGroups: () => set((state) => ({ showGroups: !state.showGroups })),
  hideSelf        : false,
  toggleHideSelf  : () => set((state) => ({ hideSelf: !state.hideSelf })),
  numFeedsInCol   : 2,
  setNumFeedsInCol: (numFeedsInCol = 2) => set({ numFeedsInCol }),
}));