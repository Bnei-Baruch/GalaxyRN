import { create } from "zustand";
import { NativeEventEmitter, NativeModules } from "react-native";
import log from "loglevel";

const permissionsModule = NativeModules.PermissionsModule;

let eventEmitter;
try {
  if (permissionsModule) {
    eventEmitter = new NativeEventEmitter(permissionsModule);
  }
} catch (error) {
  log.error("[inits] Error creating permissions NativeEventEmitter:", error);
}

let subscription;

// Export the store
export const useAndroidPermissionsStore = create((set, get) => ({
  permissionsReady: false,
  initAndroidPermissions: async () => {
    if (!permissionsModule) {
      log.debug("[inits] Permissions module not found");
      return;
    }

    const permissionsReady = await permissionsModule.getPermissionStatus();
    log.info("[inits] permissionsReady: ", permissionsReady);

    if (permissionsReady) {
      set({ permissionsReady: true });
      return;
    }

    try {
      permissionsModule.addListener("permissionsStatus");
      subscription = eventEmitter?.addListener(
        "permissionsStatus",
        (event) => {
          if (event && event.allGranted) {
            log.info("[inits] All Android permissions granted!");
            set({ permissionsReady: true });
          }
        }
      );
    } catch (error) {
      log.error("[inits] Error setting up permissions event emitter:", error);
      set({ permissionsReady: true });
    }
  },
  terminateAndroidPermissions: () => {
    if (subscription) subscription.remove();
  },
}));
