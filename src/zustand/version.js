import { create } from "zustand";
import { Platform, Linking } from "react-native";
import { APP_STORE_ID, GOOGLE_PLAY_ID } from "@env";
import log from "loglevel";

const LOG_TAG = "[VersionStore]";

export const compareVersions = (v1, v2) => {
  const v1Parts = v1.split(".").map(Number);
  const v2Parts = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
};
const getStoreUrl = () => {
  if (Platform.OS === "ios") {
    return `itms-apps://itunes.apple.com/app/${APP_STORE_ID}`;
  } else if (Platform.OS === "android") {
    return `market://details?id=${GOOGLE_PLAY_ID}`;
  }
  return "";
};

const getUpdateAssessment = (storeVersion, currentVersion) => {
  log.debug(`${LOG_TAG} Assessing update`, { storeVersion, currentVersion });

  // If we couldn't fetch store version, no updates available
  if (!storeVersion) {
    log.info(`${LOG_TAG} No store version available for assessment`);
    return {
      updateAvailable: false,
      forceUpdate: false,
    };
  }

  const versionDiff = compareVersions(storeVersion, currentVersion);
  log.debug(`${LOG_TAG} Version difference`, { versionDiff });

  if (versionDiff <= 0) {
    // Store version is same or older than current version
    log.info(`${LOG_TAG} No update needed, current version is up to date`);
    return {
      updateAvailable: false,
      forceUpdate: false,
    };
  }

  // Parse version components to determine if update should be forced
  const currentParts = currentVersion.split(".").map(Number);
  const storeParts = storeVersion.split(".").map(Number);

  // Force update for major or minor version changes
  // (e.g. 1.0.0 → 2.0.0 or 1.1.0 → 1.2.0)
  const forceUpdate =
    storeParts[0] > currentParts[0] ||
    (storeParts[0] === currentParts[0] && storeParts[1] > currentParts[1]);

  log.info(`${LOG_TAG} Update assessment complete`, {
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
  currentVersion: require("../../package.json").version,
  latestVersion: null,
  updateAvailable: false,
  forceUpdate: false,

  // Actions
  openAppStore: () => {
    const url = getStoreUrl();
    log.info(`${LOG_TAG} Attempting to open app store`, { url });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        log.info(`${LOG_TAG} Opening app store with deep link`, { url });
        Linking.openURL(url);
      } else {
        // If the deep link fails, try the web URL
        const webUrl =
          Platform.OS === "ios"
            ? `https://apps.apple.com/app/id${APP_STORE_ID}`
            : `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_ID}`;

        log.info(`${LOG_TAG} Deep link not supported, trying web URL`, {
          webUrl,
        });
        Linking.openURL(webUrl).catch((err) => {
          log.error(`${LOG_TAG} Cannot open app store URL:`, err);
        });
      }
    });
  },

  fetchPlayStoreVersion: async () => {
    log.info(`${LOG_TAG} Fetching Play Store version`);
    try {
      const url = `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_ID}&hl=en`;
      log.debug(`${LOG_TAG} Fetching from URL`, { url });

      const response = await fetch(url);
      const html = await response.text();

      // Extract version info from the HTML response
      const versionMatch = html.match(
        /Current Version<\/div><span[^>]*>([^<]+)<\/span>/i
      );
      if (versionMatch && versionMatch[1]) {
        const version = versionMatch[1].trim();
        log.info(`${LOG_TAG} Play Store version found`, { version });
        return version;
      }
      log.warn(`${LOG_TAG} Could not extract Play Store version from response`);
    } catch (error) {
      log.error(`${LOG_TAG} Error fetching Play Store version:`, error);
    }
    return null;
  },

  fetchAppStoreVersion: async () => {
    log.info(`${LOG_TAG} Fetching App Store version`);
    try {
      const url = `https://itunes.apple.com/lookup?id=${APP_STORE_ID}`;
      log.debug(`${LOG_TAG} Fetching from URL`, { url });

      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const version = data.results[0].version;
        log.info(`${LOG_TAG} App Store version found`, { version });
        return version;
      }
      log.warn(`${LOG_TAG} No version found in App Store response`);
    } catch (error) {
      log.error(`${LOG_TAG} Error fetching App Store version:`, error);
    }
    return null;
  },

  fetchStoreVersion: async () => {
    log.info(`${LOG_TAG} Fetching store version for platform`, {
      platform: Platform.OS,
    });
    if (Platform.OS === "ios") {
      return get().fetchAppStoreVersion();
    } else if (Platform.OS === "android") {
      return get().fetchPlayStoreVersion();
    }
    log.warn(`${LOG_TAG} Unknown platform, cannot fetch store version`);
    return null;
  },

  checkForUpdate: async () => {
    log.info(`${LOG_TAG} Starting version update check`);
    try {
      set({ checking: true });
      const { currentVersion } = get();
      log.debug(`${LOG_TAG} Current version`, { currentVersion });

      // Get the latest version from store
      const storeVersion = "1.2.1"; //await get().fetchStoreVersion() || currentVersion;
      log.debug(`${LOG_TAG} Store version fetched`, { storeVersion });

      // Get assessment based on version comparison
      const { updateAvailable, forceUpdate } = getUpdateAssessment(
        storeVersion,
        currentVersion
      );

      const result = {
        updateAvailable,
        forceUpdate,
        checking: false,
        latestVersion: storeVersion,
      };

      log.info(`${LOG_TAG} Update check complete`, result);
      set(result);
    } catch (error) {
      log.error(`${LOG_TAG} Error checking for updates:`, error);
      set({
        checking: false,
        updateAvailable: false,
        forceUpdate: false,
      });
      return null;
    }
  },
}));
