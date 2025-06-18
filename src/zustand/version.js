import { create } from "zustand";
import { Platform, Linking } from "react-native";
import { APP_STORE_ID, GOOGLE_PLAY_ID } from "@env";
import logger from "../services/logger";

const NAMESPACE = 'Version';

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
  logger.debug(NAMESPACE, "Assessing update", { storeVersion, currentVersion });

  // If we couldn't fetch store version, no updates available
  if (!storeVersion) {
    logger.info(NAMESPACE, "No store version available for assessment");
    return {
      updateAvailable: false,
      forceUpdate: false,
    };
  }

  const versionDiff = compareVersions(storeVersion, currentVersion);
  logger.debug(NAMESPACE, "Version difference", { versionDiff });

  if (versionDiff <= 0) {
    // Store version is same or older than current version
    logger.info(NAMESPACE, "No update needed, current version is up to date");
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

  logger.info(NAMESPACE, "Update assessment complete", {
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
    logger.info(NAMESPACE, "Attempting to open app store", { url });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        logger.info(NAMESPACE, "Opening app store with deep link", { url });
        Linking.openURL(url);
      } else {
        // If the deep link fails, try the web URL
        const webUrl =
          Platform.OS === "ios"
            ? `https://apps.apple.com/app/id${APP_STORE_ID}`
            : `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_ID}`;

        logger.info(NAMESPACE, "Deep link not supported, trying web URL", {
          webUrl,
        });
        Linking.openURL(webUrl).catch((err) => {
          logger.error(NAMESPACE, "Cannot open app store URL:", err);
        });
      }
    });
  },

  fetchPlayStoreVersion: async () => {
    logger.info(NAMESPACE, "Fetching Play Store version");
    try {
      const url = `https://play.google.com/store/apps/details?id=${GOOGLE_PLAY_ID}&hl=en`;
      logger.debug(NAMESPACE, "Fetching from URL", { url });

      const response = await fetch(url);
      const html = await response.text();

      // Extract version info from the HTML response
      const versionMatch = html.match(
        /Current Version<\/div><span[^>]*>([^<]+)<\/span>/i
      );
      if (versionMatch && versionMatch[1]) {
        const version = versionMatch[1].trim();
        logger.info(NAMESPACE, "Play Store version found", { version });
        return version;
      }
      logger.warn(NAMESPACE, "Could not extract Play Store version from response");
    } catch (error) {
      logger.error(NAMESPACE, "Error fetching Play Store version:", error);
    }
    return null;
  },

  fetchAppStoreVersion: async () => {
    logger.info(NAMESPACE, "Fetching App Store version");
    try {
      const url = `https://itunes.apple.com/lookup?id=${APP_STORE_ID}`;
      logger.debug(NAMESPACE, "Fetching from URL", { url });

      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const version = data.results[0].version;
        logger.info(NAMESPACE, "App Store version found", { version });
        return version;
      }
      logger.warn(NAMESPACE, "No version found in App Store response");
    } catch (error) {
      logger.error(NAMESPACE, "Error fetching App Store version:", error);
    }
    return null;
  },

  fetchStoreVersion: async () => {
    logger.info(NAMESPACE, "Fetching store version for platform", {
      platform: Platform.OS,
    });
    if (Platform.OS === "ios") {
      return get().fetchAppStoreVersion();
    } else if (Platform.OS === "android") {
      return get().fetchPlayStoreVersion();
    }
    logger.warn(NAMESPACE, "Unknown platform, cannot fetch store version");
    return null;
  },

  checkForUpdate: async () => {
    logger.info(NAMESPACE, "Starting version update check");
    try {
      set({ checking: true });
      const { currentVersion } = get();
      logger.debug(NAMESPACE, "Current version", { currentVersion });

      // Get the latest version from store
      const storeVersion = await get().fetchStoreVersion() || currentVersion;
      logger.debug(NAMESPACE, "Store version fetched", { storeVersion });

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

      logger.info(NAMESPACE, "Update check complete", result);
      set(result);
    } catch (error) {
      logger.error(NAMESPACE, "Error checking for updates:", error);
      set({
        checking: false,
        updateAvailable: false,
        forceUpdate: false,
      });
    }
  },
}));
