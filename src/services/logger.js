import RNFS from "react-native-fs";
import { Linking } from "react-native";

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

  async sendFile(email = "") {
    try {
      const fileContent = await RNFS.readFile(this.logFilePath, "utf8");
      const subject = encodeURIComponent("Application Logs");
      const body = encodeURIComponent(fileContent);
      const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        console.error("No email client found");
      }
    } catch (error) {
      console.error("Failed to send log file:", error);
    }
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
    if (__DEV__ || !this.debugMode) return;

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

// Export the logger functions
export const debug = (...args) => logger.debug(...args);
export const info = (...args) => logger.info(...args);
export const warn = (...args) => logger.warn(...args);
export const error = (...args) => logger.error(...args);

// Export the default logger for general use
export default logger;
