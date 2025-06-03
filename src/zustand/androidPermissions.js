import { create } from "zustand";
import { NativeModules, NativeEventEmitter } from "react-native";
import { debug, info, error } from "../services/logger";

const NAMESPACE = 'AndroidPermissions';

let eventEmitter = null;
try {
  if (NativeModules.PermissionsModule) {
    eventEmitter = new NativeEventEmitter(NativeModules.PermissionsModule);
  } else {
    error(NAMESPACE, "Error creating permissions NativeEventEmitter:", error);
  }
} catch (error) {
  debug(NAMESPACE, "Permissions module not found");
}

export const useAndroidPermissionsStore = create((set) => ({
  permissionsReady: false,
  setPermissionsReady: (permissionsReady) => {
    info(NAMESPACE, "permissionsReady: ", permissionsReady);
    set({ permissionsReady });
  },
  initPermissions: () => {
    if (!eventEmitter) return;

    try {
      eventEmitter.addListener("permissionsGranted", () => {
        info(NAMESPACE, "All Android permissions granted!");
        set({ permissionsReady: true });
      });
    } catch (error) {
      error(NAMESPACE, "Error setting up permissions event emitter:", error);
    }
  },
}));
