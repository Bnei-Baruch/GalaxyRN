// External libraries
import { create } from 'zustand';

// i18n

// Shared modules

// Zustand stores
import { useFeedsStore } from './feeds';
import { useInRoomStore } from './inRoom';
import { useShidurStore } from './shidur';
import { useUiActions } from './uiActions';
import { useUserStore } from './user';

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
    if (!isShidur) {
      await useShidurStore.getState().cleanShidur();
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
