// React Native modules
import { NativeEventEmitter, NativeModules } from 'react-native';

// External libraries
import { create } from 'zustand';

// Services
import logger from '../services/logger';

const NAMESPACE = 'androidPermissions';

logger.debug(NAMESPACE, 'NativeModules on Android:', NativeModules);
const permissionsModule = NativeModules.PermissionsModule;

let eventEmitter;
try {
  if (permissionsModule) {
    eventEmitter = new NativeEventEmitter(permissionsModule);
  }
} catch (error) {
  logger.error(
    NAMESPACE,
    'Error creating permissions NativeEventEmitter:',
    error
  );
}

let subscription;

// Export the store
export const useAndroidPermissionsStore = create((set, get) => ({
  permissionsReady: false,

  initPermissions: async () => {
    if (!permissionsModule) {
      logger.debug(NAMESPACE, 'Permissions module not found');
      return;
    }

    const permissionsReady = await permissionsModule.getPermissionStatus();
    logger.info(NAMESPACE, 'permissionsReady: ', permissionsReady);

    if (permissionsReady) {
      set({ permissionsReady: true });
      return;
    }

    try {
      subscription = eventEmitter?.addListener('permissionsStatus', event => {
        logger.debug(NAMESPACE, 'initAndroidPermissions eventEmitter', event);
        if (event && event.allGranted) {
          logger.info(NAMESPACE, 'All Android permissions granted!');
          set({ permissionsReady: true });
        }
      });
    } catch (error) {
      logger.error(
        NAMESPACE,
        'Error setting up permissions event emitter:',
        error
      );
      set({ permissionsReady: true });
    }
  },

  terminatePermissions: () => {
    logger.debug(NAMESPACE, 'terminatePermissions');
    if (subscription) subscription.remove();
  },
}));
