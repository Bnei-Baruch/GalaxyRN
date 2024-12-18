import { create } from 'zustand';
import { useMyStreamStore } from './myStream';
import { useShidurStore } from './shidur';
import { deactivateFeedsVideos, useInRoomStore, activateFeedsVideos } from './inRoom';
import { useUserStore } from './user';

export const useSettingsStore = create((set, get) => ({
  uiLang           : 'en',
  autoEnterRoom    : true,
  changeUiLang     : (lang) => set({ uiLang: lang }),
  readyForJoin     : false,
  setReadyForJoin  : (readyForJoin = true) => set({ readyForJoin }),
  question         : false,
  toggleQuestion   : () => {
    const { question } = get();
    useUserStore.getState().sendUserState({ question });
    set((state) => ({ question: !state.question }));
  },
  isBroadcast      : true,
  toggleIsBroadcast: () => set((state) => ({ isBroadcast: !state.isBroadcast })),
  audioMode        : false,
  toggleAudioMode  : async (audioMode = !get().audioMode) => {
    audioMode ? get().enterAudioMode() : get().exitAudioMode();
    set({ audioMode });
  },
  enterAudioMode   : async () => {
    const { toggleCammute } = useMyStreamStore.getState();
    toggleCammute(true);

    const feeds = Object.values(useInRoomStore.getState().memberByFeed);
    deactivateFeedsVideos(feeds);

    const { enterAudioMode, cleanQuads, isQuad, } = useShidurStore.getState();
    enterAudioMode();
    if (isQuad) {
      cleanQuads(false);
    }
  },
  exitAudioMode    : async () => {
    const { toggleCammute } = useMyStreamStore.getState();
    toggleCammute(false);

    const feeds = Object.values(useInRoomStore.getState().memberByFeed);
    activateFeedsVideos(feeds);

    const { exitAudioMode, initQuad, isQuad, isBroadcast } = useShidurStore.getState();
    if (isBroadcast) {
      exitAudioMode();
    }
    if (isQuad) {
      initQuad();
    }
  },
  showGroups       : false,
  toggleShowGroups : () => set((state) => ({ showGroups: !state.showGroups })),
  hideSelf         : false,
  toggleHideSelf   : () => set((state) => ({ hideSelf: !state.hideSelf })),
}));