import { DeviceEventEmitter, NativeModules } from 'react-native';
import { create } from 'zustand';
import logger from '../services/logger';

const NAMESPACE = 'androidPermissions';

logger.debug(NAMESPACE, 'NativeModules on Android:', NativeModules);
const permissionsModule = NativeModules.PermissionsModule;

let subscription;

export const useAndroidPermissionsStore = create((set, get) => ({
  permReady: false,
  setPermReady: (permReady = true) => set({ permReady }),

  initPermissions: async () => {
    logger.debug(NAMESPACE, 'initPermissions');
    if (!permissionsModule) {
      logger.debug(NAMESPACE, 'Permissions module not found');
      return;
    }

    if (subscription) {
      logger.debug(NAMESPACE, 'Removing existing subscription');
      subscription.remove();
      subscription = null;
    }

    const permReady = await permissionsModule.getPermissionStatus();
    logger.info(NAMESPACE, 'Permission status:', permReady);

    if (permReady) {
      set({ permReady: true });
      logger.debug(NAMESPACE, 'permReady: already true');
      return;
    }

    try {
      logger.debug(NAMESPACE, 'Setting up permissions status listener');
      subscription = DeviceEventEmitter.addListener(
        'permissionsStatus',
        event => {
          logger.debug(NAMESPACE, 'initAndroidPermissions eventEmitter', event);
          if (event && event.allGranted) {
            logger.info(NAMESPACE, 'All Android permissions granted!');
            set({ permReady: true });
          }
        }
      );
      logger.debug(
        NAMESPACE,
        'Permissions status listener set up successfully'
      );
    } catch (error) {
      logger.error(
        NAMESPACE,
        'Error setting up permissions event emitter:',
        error
      );
      set({ permReady: true });
    }
  },

  terminatePermissions: () => {
    logger.debug(NAMESPACE, 'terminatePermissions');
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
  },
}));
