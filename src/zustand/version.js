import { APP_STORE_ID, GOOGLE_PLAY_ID } from '@env';
import { Linking, Platform } from 'react-native';
import { create } from 'zustand';
import logger from '../services/logger';

const NAMESPACE = 'Version';

export const compareVersions = (v1, v2) => {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
};
const getStoreUrl = () => {
  if (Platform.OS === 'ios') {
    return `itms-apps://itunes.apple.com/app/${APP_STORE_ID}`;
  } else if (Platform.OS === 'android') {
    return `market://details?id=${GOOGLE_PLAY_ID}`;
  }
  return '';
};

const getUpdateAssessment = (storeVersion, currentVersion) => {
  logger.debug(NAMESPACE, 'Assessing update', { storeVersion, currentVersion });

  if (!storeVersion) {
    logger.info(NAMESPACE, 'No store version available for assessment');
    return {
      updateAvailable: false,
      forceUpdate: false,
    };
  }

  const versionDiff = compareVersions(storeVersion, currentVersion);
  logger.debug(NAMESPACE, 'Version difference', { versionDiff });

  if (versionDiff <= 0) {
    logger.info(NAMESPACE, 'No update needed, current version is up to date');
    return {
      updateAvailable: false,
      forceUpdate: false,
    };
  }

  const currentParts = currentVersion.split('.').map(Number);
  const storeParts = storeVersion.split('.').map(Number);

  // Force update for major or minor version changes
  // (e.g. 1.0.0 → 2.0.0 or 1.1.0 → 1.2.0)
  const forceUpdate =
    storeParts[0] > currentParts[0] ||
    (storeParts[0] === currentParts[0] && storeParts[1] > currentParts[1]);

  logger.info(NAMESPACE, 'Update assessment complete', {
    updateAvailable: true,
    forceUpdate,
    storeVersion,
    currentVersion,
  });

  return {
    updateAvailable: true,
    forceUpdate,
  };
};

export const useVersionStore = create((set, get) => ({
  // State
  checking: true,
  currentVersion: require('../../package.json').version,
  latestVersion: null,
  updateAvailable: false,
  forceUpdate: false,

  // Actions
  openAppStore: () => {
    const url = getStoreUrl();
    logger.info(NAMESPACE, 'Attempting to open app store', { url });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        logger.info(NAMESPACE, 'Opening app store with deep link', { url });
        Linking.openURL(url);
      } else {
        const webUrl =
          Platform.OS === 'ios'
            ? `https://apps.apple.com/app/id${APP_STORE_ID}`
            : `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_ID}`;

        logger.info(NAMESPACE, 'Deep link not supported, trying web URL', {
          webUrl,
        });
        Linking.openURL(webUrl).catch(err => {
          logger.error(NAMESPACE, 'Cannot open app store URL:', err);
        });
      }
    });
  },

  onMessage: data => {
    logger.debug(NAMESPACE, 'onMessage: ', data);

    const { versions } = data;
    logger.debug(NAMESPACE, 'versions: ', versions);
    const latestVersion = versions[Platform.OS]?.version;

    const { updateAvailable, forceUpdate } = getUpdateAssessment(
      latestVersion,
      get().currentVersion
    );

    const result = {
      updateAvailable,
      forceUpdate,
      latestVersion,
    };

    logger.info(NAMESPACE, 'Update check complete', result);
    set(result);
  },
}));
