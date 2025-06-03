import RNFS from "react-native-fs";
import { Linking, Platform, Dimensions } from "react-native";
import { SUPPORT_EMAIL } from "@env";

class Logger {
  constructor() {
    this.logFilePath = `${RNFS.DocumentDirectoryPath}/app.log`;
    this.initializeLogFile();
    this.debugMode = false;
  }

  async initializeLogFile() {
    try {
      // Create log file if it doesn't exist
      const exists = await RNFS.exists(this.logFilePath);
      if (!exists) {
        await RNFS.writeFile(this.logFilePath, "", "utf8");
      }

      // Keep log file size in check (max 5MB)
      const stats = await RNFS.stat(this.logFilePath);
      if (stats.size > 5 * 1024 * 1024) {
        // 5MB
        await RNFS.writeFile(this.logFilePath, "", "utf8");
      }
    } catch (error) {
      console.error("Failed to initialize log file:", error);
    }
  }

  async writeToFile(message) {
    try {
      await RNFS.appendFile(this.logFilePath, message + "\n", "utf8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  async sendFile(email = SUPPORT_EMAIL) {
    try {
      const logsBase64 = await RNFS.readFile(this.logFilePath, "base64");
      const zustandStore = this.getZustandStore();

      const storeFilePath = `${RNFS.DocumentDirectoryPath}/store_state.json`;
      await RNFS.writeFile(storeFilePath, zustandStore, "utf8");
      const storeBase64 = await RNFS.readFile(storeFilePath, "base64");

      const deviceInfo = this.getDeviceInfo();
      const deviceFilePath = `${RNFS.DocumentDirectoryPath}/device_info.json`;
      await RNFS.writeFile(deviceFilePath, deviceInfo, "utf8");
      const deviceBase64 = await RNFS.readFile(deviceFilePath, "base64");

      const subject = encodeURIComponent("Application Logs");
      const mailtoUrl = `mailto:${email}?subject=${subject}&attachment=data:text/plain;base64,${logsBase64}&attachment=data:application/json;base64,${storeBase64}&attachment=data:application/json;base64,${deviceBase64}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        // Clean up temp files
        await RNFS.unlink(storeFilePath);
        await RNFS.unlink(deviceFilePath);
      } else {
        console.error("No email client found");
      }
    } catch (error) {
      console.error("Failed to send log file:", error);
    }
  }

  getZustandStore() {
    const stores = {
      user: require("../zustand/user").useUserStore.getState(),
      room: require("../zustand/fetchRooms").default.getState(),
      inRoom: require("../zustand/inRoom").useInRoomStore.getState(),
      settings: require("../zustand/settings").useSettingsStore.getState(),
      shidur: require("../zustand/shidur").useShidurStore.getState(),
      inits: require("../zustand/inits").useInitsStore.getState(),
      chat: require("../zustand/chat").useChatStore.getState(),
      version: require("../zustand/version").useVersionStore.getState(),
      subtitle: require("../zustand/subtitle").useSubtitleStore.getState(),
      uiActions: require("../zustand/uiActions").useUiActions.getState(),
      materials: require("../zustand/fetchMaterials").default.getState(),
    };

    return JSON.stringify(stores, null, 2);
  }

  getDeviceInfo() {
    const window = Dimensions.get("window");
    const screen = Dimensions.get("screen");

    const deviceInfo = {
      platform: Platform,
      window: window,
      screen: screen,
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(deviceInfo, null, 2);
  }

  formatMessage(level, ...args) {
    const timestamp = new Date().toISOString();
    const stack = new Error().stack
      .split("\n")
      .slice(3) // Skip Error and logger internal calls
      .map((line) => line.trim())
      .join("\n    "); // Indent stack lines for better readability
    return [
      `[${timestamp}] [${level}]`,
      ...args,
      "\nStack Trace:\n    " + stack,
    ];
  }

  async log(level, ...args) {
    if (!this.debugMode) return;

    const formattedMessage = this.formatMessage(level, ...args);

    const message = formattedMessage
      .map((arg) =>
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      )
      .join(" ");

    await this.writeToFile(message);
  }

  toggleDebugMode(debugMode) {
    if (!debugMode) {
      this.info("Debug mode disabled");
    }
    this.debugMode = debugMode;
    if (debugMode) {
      this.info("Debug mode enabled");
    }
  }

  async trace(...args) {
    console.trace(...args);
    await this.log("TRACE", ...args);
  }

  async debug(...args) {
    console.debug(...args);
    await this.log("DEBUG", ...args);
  }

  async info(...args) {
    console.info(...args);
    await this.log("INFO", ...args);
  }

  async warn(...args) {
    console.warn(...args);
    await this.log("WARN", ...args);
  }

  async error(...args) {
    console.error(...args);
    await this.log("ERROR", ...args);
  }
}

// Create singleton instance
const logger = new Logger();

// Export the default logger for general use
export default logger;
