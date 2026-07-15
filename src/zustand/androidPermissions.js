// React Native modules
import { PermissionsAndroid, Platform } from 'react-native';

// External libraries
import { create } from 'zustand';

// Services
import logger from '../services/logger';

const NAMESPACE = 'androidPermissions';
const POLL_INTERVAL_MS = 1000;

const getRequiredPermissions = () => {
  const permissions = [
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  ];

  // Matches PermissionHelper.permissionsByVersion() on the native side.
  if (Platform.Version >= 31) {
    permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
  }
  if (Platform.Version >= 33) {
    permissions.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  return permissions;
};

let pollTimer = null;

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

// Export the store
export const useAndroidPermissionsStore = create((set) => ({
  permReady: false,
  permissionStatuses: {},
  setPermReady: (permReady = true) => set({ permReady }),

  initPermissions: async () => {
    logger.debug(NAMESPACE, 'initPermissions');
    stopPolling();

    const checkAll = async () => {
      const permissions = getRequiredPermissions();
      const results = await Promise.all(
        permissions.map(permission => PermissionsAndroid.check(permission))
      );
      const statuses = {};
      permissions.forEach((permission, i) => {
        statuses[permission] = results[i];
      });
      const allGranted = results.every(Boolean);
      logger.debug(NAMESPACE, 'Permission status', statuses);
      set({ permissionStatuses: statuses, permReady: allGranted });

      if (allGranted) {
        stopPolling();
      }
      return allGranted;
    };

    const alreadyGranted = await checkAll();
    if (!alreadyGranted) {
      pollTimer = setInterval(checkAll, POLL_INTERVAL_MS);
    }
  },

  terminatePermissions: () => {
    logger.debug(NAMESPACE, 'terminatePermissions');
    stopPolling();
  },
}));
