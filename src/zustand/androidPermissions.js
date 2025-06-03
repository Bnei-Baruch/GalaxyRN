import { create } from "zustand";
import { NativeEventEmitter, NativeModules } from "react-native";
import logger from "../services/logger";

const permissionsModule = NativeModules.PermissionsModule;

const NAMESPACE = "androidPermissions zustand";

let eventEmitter;
try {
  if (permissionsModule) {
    eventEmitter = new NativeEventEmitter(permissionsModule);
  }
} catch (error) {
  logger.error(NAMESPACE, "Error creating permissions NativeEventEmitter:", error);
}

let subscription;

// Export the store
export const useAndroidPermissionsStore = create((set, get) => ({
  permissionsReady: false,
  initPermissions: async () => {
    if (!permissionsModule) {
      logger.debug(NAMESPACE, "Permissions module not found");
      return;
    }

    const permissionsReady = await permissionsModule.getPermissionStatus();
    logger.info(NAMESPACE, "permissionsReady: ", permissionsReady);

    if (permissionsReady) {
      set({ permissionsReady: true });
      return;
    }

    try {
      subscription = eventEmitter?.addListener("permissionsStatus", (event) => {
        console.log("[RN render] initAndroidPermissions eventEmitter", event);
        if (event && event.allGranted) {
          logger.info(NAMESPACE, "All Android permissions granted!");
          set({ permissionsReady: true });
        }
      });
    } catch (error) {
      logger.error(NAMESPACE, "Error setting up permissions event emitter:", error);
      set({ permissionsReady: true });
    }
  },
  terminatePermissions: () => {
    logger.debug(NAMESPACE, "terminatePermissions");
    if (subscription) subscription.remove();
  },
}));
