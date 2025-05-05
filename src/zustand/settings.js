import { create } from "zustand";
import { useMyStreamStore } from "./myStream";
import { useShidurStore } from "./shidur";
import {
  deactivateFeedsVideos,
  useInRoomStore,
  activateFeedsVideos,
} from "./inRoom";
import { useUserStore } from "./user";
import { getFromStorage, setToStorage } from "../shared/tools";
import { useUiActions } from "./uiActions";
import { useInitsStore } from "./inits";
import { setLanguage } from "../i18n/i18n";
import { Platform } from "react-native";

// Держим референс на слушатель, чтобы можно было удалить его при необходимости
let orientationListener = null;

export const useSettingsStore = create((set, get) => ({
  uiLang: "en",
  autoEnterRoom: false,
  setUiLang: (uiLang) => {
    set({ uiLang });
    setLanguage(uiLang);
    setToStorage("ui_lang", uiLang);
  },
  question: false,
  isFullscreen: false,
  toggleIsFullscreen: () => {
    const isFullscreen = !get().isFullscreen;

    // Import is inside the function to avoid circular dependencies
    const Orientation = require("react-native-orientation-locker").default;

    if (isFullscreen) {
      if (Platform.OS === "ios") {
        Orientation.lockToLandscapeLeft();
      } else {
        Orientation.lockToLandscape();
      }

      if (!orientationListener) {
        orientationListener = (orientation) => {
          if (
            orientation === "PORTRAIT" ||
            orientation === "PORTRAITUPSIDEDOWN"
          ) {
            if (Platform.OS === "ios") {
              Orientation.lockToLandscapeLeft();
            } else {
              Orientation.lockToLandscape();
            }
          }
        };
        Orientation.addOrientationListener(orientationListener);
      }

      useUiActions.getState().toggleShowBars(false, false);
    } else {
      if (orientationListener) {
        Orientation.removeOrientationListener(orientationListener);
        orientationListener = null;
      }

      Orientation.unlockAllOrientations();
      useUiActions.getState().toggleShowBars(true);
    }

    useShidurStore.getState().toggleShidurBar(false, !isFullscreen);

    set({ isFullscreen });
  },
  toggleQuestion: (question = !get().question) => {
    useUserStore.getState().sendUserState({ question });
    set({ question });
  },
  isShidur: true,
  toggleIsShidur: () => {
    const isShidur = !get().isShidur;
    !isShidur && useShidurStore.getState().cleanShidur();
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
    const cammute = await getFromStorage("cammute", false).then(
      (x) => x === "true"
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
  toggleShowGroups: () => set((state) => ({ showGroups: !state.showGroups })),
  hideSelf: false,
  toggleHideSelf: () => set((state) => ({ hideSelf: !state.hideSelf })),

  // Функция для очистки ресурсов
  cleanup: () => {
    // Удаляем слушатель ориентации при выгрузке приложения
    if (orientationListener) {
      const Orientation = require("react-native-orientation-locker").default;
      Orientation.removeOrientationListener(orientationListener);
      orientationListener = null;
    }
  },
}));
