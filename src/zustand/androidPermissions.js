import { create } from "zustand";
import { NativeModules, NativeEventEmitter } from "react-native";
import logger from "../services/logger";

const NAMESPACE = 'AndroidPermissions';

let eventEmitter = null;
try {
  if (NativeModules.PermissionsModule) {
    eventEmitter = new NativeEventEmitter(NativeModules.PermissionsModule);
  } else {
    logger.error(NAMESPACE, "Error creating permissions NativeEventEmitter:", error);
  }
} catch (error) {
  logger.debug(NAMESPACE, "Permissions module not found");
}

export const useAndroidPermissionsStore = create((set) => ({
  permissionsReady: false,
  setPermissionsReady: (permissionsReady) => {
    logger.info(NAMESPACE, "permissionsReady: ", permissionsReady);
    set({ permissionsReady });
  },
  initPermissions: () => {
    if (!eventEmitter) return;

    try {
      eventEmitter.addListener("permissionsGranted", () => {
        logger.info(NAMESPACE, "All Android permissions granted!");
        set({ permissionsReady: true });
      });
    } catch (error) {
      logger.error(NAMESPACE, "Error setting up permissions event emitter:", error);
    }
  },
}));
