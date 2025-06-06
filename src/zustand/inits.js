import { create } from "zustand";
import { Platform, NativeEventEmitter, NativeModules } from "react-native";
import mqtt from "../shared/mqtt";
import log from "loglevel";
import { useUserStore } from "./user";
import { getFromStorage } from "../shared/tools";
import api from "../shared/Api";
import ConfigStore from "../shared/ConfigStore";
import GxyConfig from "../shared/janus-config";

import { useInRoomStore } from "./inRoom";
import { useSettingsStore } from "./settings";
import { useMyStreamStore } from "./myStream";
import { useShidurStore } from "./shidur";
import kc from "../auth/keycloak";
import BackgroundTimer from "react-native-background-timer";
import { useUiActions } from "./uiActions";
import CallsBridge from "../services/CallsBridge";

// Safely create event emitter only if CallsBridge.raw is defined
let eventEmitter;
try {
  if (CallsBridge && CallsBridge.raw) {
    eventEmitter = new NativeEventEmitter(CallsBridge.raw);
  } else {
    log.warn("[inits] CallsBridge.raw is undefined, event emitter not created");
  }
} catch (error) {
  log.error("[inits] Error creating NativeEventEmitter:", error);
}

let subscription;

// Export the store
export const useInitsStore = create((set, get) => ({
  permissionsReady: false,
  setPermissionsReady: (permissionsReady = true) => set({ permissionsReady }),
  mqttReady: false,
  configReady: false,
  readyForJoin: false,
  setReadyForJoin: (readyForJoin = true) => set({ readyForJoin }),
  isPortrait: true,
  setIsPortrait: (isPortrait) => {
    useUiActions.getState().updateWidth();
    set({ isPortrait });
  },
  initMQTT: () => {
    const { user } = useUserStore.getState();
    mqtt.init(user, (reconnected, error) => {
      if (error) {
        log.info("[client] MQTT disconnected");
        set(() => ({ mqttReady: false }));
        alert("- Lost Connection to Arvut System -");
      } else if (reconnected) {
        set(() => ({ mqttReady: true }));
        log.info("[client] MQTT reconnected");
      } else {
        set(() => ({ mqttReady: true }));

        mqtt.join("galaxy/users/notification");
        mqtt.join("galaxy/users/broadcast");

        const { user } = useUserStore.getState();
        const { toggleCammute, toggleMute } = useMyStreamStore.getState();
        const { streamGalaxy } = useShidurStore.getState();
        const { toggleQuestion } = useSettingsStore.getState();
        const { updateDisplayById } = useInRoomStore.getState();
        const { restartRoom } = useInRoomStore.getState();

        mqtt.watch((data) => {
          const { type, id, bitrate } = data;

          if (
            user.id === id &&
            ["client-reconnect", "client-reload", "client-disconnect"].includes(
              type
            )
          ) {
            restartRoom();
          } else if (type === "client-kicked" && user.id === id) {
            kc.logout();
          } else if (type === "client-question" && user.id === id) {
            toggleQuestion();
          } else if (type === "client-mute" && user.id === id) {
            toggleMute();
          } else if (type === "video-mute" && user.id === id) {
            toggleCammute();
          } else if (type === "audio-out") {
            log.debug("call streamGalaxy bug: [mqtt] audio-out: ", data);
            streamGalaxy(data.status);
            if (data.status) {
              // remove question mark when sndman unmute our room
              toggleQuestion(false);
            }
          } else if (type === "reload-config") {
            //this.reloadConfig();
          } else if (type === "client-reload-all") {
            restartRoom();
          } else if (type === "client-state") {
            updateDisplayById(data.user);
          }
        });
      }
    });
  },
  endMqtt: async () => {
    await mqtt.end();
    set(() => ({ mqttReady: false, configReady: false }));
  },
  initConfig: async () => {
    useUserStore.getState().setGeoInfo();

    try {
      const configData = await api.fetchConfig();
      log.debug("[client] got config: ", configData);
      ConfigStore.setGlobalConfig(configData);
      GxyConfig.setGlobalConfig(configData);
      set(() => ({ configReady: true }));
    } catch (err) {
      log.error("[client] error initializing app", err);
    }
  },
  initApp: async () => {
    BackgroundTimer.start();
    let _isPlay = false;
    const uiLang = await getFromStorage("ui_lang", "en");
    useSettingsStore.getState().setUiLang(uiLang);

    // Only add listener if eventEmitter is defined
    if (eventEmitter) {
      subscription = eventEmitter.addListener(
        "onCallStateChanged",
        async (data) => {
          const { exitRoom } = useInRoomStore.getState();

          if (data.state === "ON_START_CALL") {
            _isPlay = useShidurStore.getState().isPlay;
            await exitRoom();
          } else if (data.state === "ON_END_CALL") {
            _isPlay = useShidurStore.getState().setAutoPlay(_isPlay);
            useInitsStore.getState().setReadyForJoin(true);
          }
        }
      );
    }
  },
  terminateApp: () => {
    BackgroundTimer.stop();
    if (subscription) subscription.remove();
  },
}));
