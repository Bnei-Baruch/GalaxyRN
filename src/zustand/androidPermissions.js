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
export const useAndroidPermissionsStore = create((set, get) => ({
  permReady: false,
  permissionStatuses: {},
  // Permissions that returned NEVER_ASK_AGAIN — the system dialog can no longer be
  // shown for them, so recovery is only possible via the system settings screen.
  blockedPermissions: {},
  setPermReady: (permReady = true) => set({ permReady }),

  checkAll: async () => {
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
  },

  // Requests a single permission via the system dialog, if it can still be shown.
  // If the user picked "don't ask again", the result is NEVER_ASK_AGAIN and the
  // permission is marked blocked so the UI falls back to "Open Settings".
  requestPermission: async permission => {
    logger.debug(NAMESPACE, 'requestPermission', permission);
    try {
      const result = await PermissionsAndroid.request(permission);
      logger.debug(NAMESPACE, 'requestPermission result', { permission, result });

      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        set(state => ({
          blockedPermissions: { ...state.blockedPermissions, [permission]: true },
        }));
      } else if (result === PermissionsAndroid.RESULTS.GRANTED) {
        set(state => {
          const blockedPermissions = { ...state.blockedPermissions };
          delete blockedPermissions[permission];
          return { blockedPermissions };
        });
      }
    } catch (e) {
      logger.error(NAMESPACE, 'requestPermission failed', permission, e);
    }

    await get().checkAll();
  },

  initPermissions: async () => {
    logger.debug(NAMESPACE, 'initPermissions');
    stopPolling();

    const alreadyGranted = await get().checkAll();
    if (!alreadyGranted) {
      pollTimer = setInterval(() => get().checkAll(), POLL_INTERVAL_MS);
    }
  },

  terminatePermissions: () => {
    logger.debug(NAMESPACE, 'terminatePermissions');
    stopPolling();
  },
}));
