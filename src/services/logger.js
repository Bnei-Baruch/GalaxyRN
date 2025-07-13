import * as Sentry from '@sentry/react-native';
import { Dimensions, NativeModules, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { useDebugStore } from '../zustand/debug';

class Logger {
  constructor() {
    // Use DocumentDirectoryPath instead of DownloadDirectoryPath to avoid permission issues
    // DocumentDirectoryPath is app-specific and doesn't require special permissions
    this.appLogsDir =
      Platform.OS === 'android'
        ? RNFS.ExternalDirectoryPath + '/logs'
        : RNFS.DocumentDirectoryPath + '/logs';
    this.logFilePath = `${this.appLogsDir}/app.log`;
    console.log('Logger logFilePath', this.logFilePath);
    this.initializeLogFile();

    this.logBuffer = [];
    this.bufferSize = 50; // Write every 50 logs
    this.isWriting = false;

    // Conditional stack traces
    this.includeStackTrace = false;
  }
  hasTag(tag) {
    //if (tag === 'Mqtt' || tag === 'JanusMqtt') return false;

    return (
      //tag === 'AudioBridge' || tag === 'AudioDevices'
      // ||tag === 'Settings'
      // || tag === 'Api'
      true
    );
  }

  async initializeLogFile() {
    try {
      // Create logs directory if it doesn't exist
      const dirExists = await RNFS.exists(this.appLogsDir);
      if (!dirExists) {
        await RNFS.mkdir(this.appLogsDir);
      }

      // Check directory size
      const dirSize = await this.checkDirectorySize();
      console.log(
        `Logs directory size: ${(dirSize / 1024 / 1024).toFixed(2)} MB`
      );

      if (dirSize > 50 * 1024 * 1024) {
        console.log('Directory size exceeds 50MB, cleaning logs directory...');
        await this.cleanDirectory(this.appLogsDir);
      }

      // Create log file if it doesn't exist
      const fileExists = await RNFS.exists(this.logFilePath);
      if (!fileExists) {
        await RNFS.writeFile(this.logFilePath, '', 'utf8');
      } else {
        // Save previous log with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${this.appLogsDir}/app_${timestamp}.log`;
        await RNFS.copyFile(this.logFilePath, backupPath);
        console.log('Previous log backed up to:', backupPath);

        // Clean the current log file
        await RNFS.writeFile(this.logFilePath, '', 'utf8');
        console.log('Current log file cleaned');
      }
    } catch (error) {
      console.error('Failed to initialize log file:', error);
    }
  }

  async checkDirectorySize() {
    try {
      const files = await RNFS.readDir(this.appLogsDir);
      let totalSize = 0;

      for (const file of files) {
        if (file.isFile()) {
          totalSize += file.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Failed to check directory size:', error);
      return 0;
    }
  }

  async cleanDirectory(dir) {
    try {
      const files = await RNFS.readDir(dir);

      for (const file of files) {
        if (file.isFile() && file.name.endsWith('.log')) {
          const filePath = `${dir}/${file.name}`;
          await RNFS.unlink(filePath);
          console.log(`Deleted log file: ${file.name}`);
        }
      }

      console.log('Logs directory cleaned successfully');
    } catch (error) {
      //console.error('Failed to clean logs directory:', error);
    }
  }

  async flushBuffer() {
    if (this.isWriting || this.logBuffer.length === 0) {
      console.log('Logger Buffer is empty or already writing');
      return;
    }

    this.isWriting = true;
    const logsToWrite = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const batchMessage = logsToWrite.join('\n') + '\n\n';
      await RNFS.appendFile(this.logFilePath, batchMessage, 'utf8');
    } catch (error) {
      console.error('Failed to write batch to log file:', error);
      // Re-add logs to buffer if write failed
      this.logBuffer.unshift(...logsToWrite);
    } finally {
      this.isWriting = false;
    }
  }

  async writeToFile(message) {
    this.logBuffer.push(message);
    if (this.logBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }
  }

  async sendFile() {
    try {
      // First ensure all buffered logs are written to file
      await this.flushBuffer();

      if (!NativeModules.LoggerModule) {
        throw new Error('LoggerModule not available');
      }

      // Create temp logs directory and copy all log files
      const tempLogsDir = `${RNFS.TemporaryDirectoryPath}/appLogs`;
      await RNFS.mkdir(tempLogsDir);

      // Copy all files from logs directory to temp directory
      const logFiles = await RNFS.readDir(this.appLogsDir);
      for (const file of logFiles) {
        if (file.isFile() && file.name.endsWith('.log')) {
          const sourcePath = `${this.appLogsDir}/${file.name}`;
          const destPath = `${tempLogsDir}/${file.name}`;
          await RNFS.copyFile(sourcePath, destPath);
          console.log(`Copied log file: ${file.name}`);
        }
      }

      const zustandStore = this.getZustandStore();
      const storeFilePath = `${tempLogsDir}/store_state.json`;
      await RNFS.writeFile(storeFilePath, zustandStore, 'utf8');
      console.log('Zustand store written to file', storeFilePath);

      const deviceInfo = this.getDeviceInfo();
      const deviceFilePath = `${tempLogsDir}/device_info.json`;
      await RNFS.writeFile(deviceFilePath, deviceInfo, 'utf8');
      console.log('Device info written to file', deviceFilePath);

      // Use native LoggerModule to compress and send logs to Sentry
      const result = await NativeModules.LoggerModule.sendLog(tempLogsDir);
      console.log('Logs sent successfully:', result);

      // Clean up temp files
      try {
        await this.cleanDirectory(tempLogsDir);
        this.initializeLogFile();
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp files:', cleanupError);
      }
    } catch (error) {
      console.error('Failed to send log file:', error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  getZustandStore() {
    const stores = {
      user: require('../zustand/user').useUserStore.getState(),
      room: require('../zustand/fetchRooms').default.getState(),
      inRoom: require('../zustand/inRoom').useInRoomStore.getState(),
      settings: require('../zustand/settings').useSettingsStore.getState(),
      shidur: require('../zustand/shidur').useShidurStore.getState(),
      inits: require('../zustand/inits').useInitsStore.getState(),
      chat: require('../zustand/chat').useChatStore.getState(),
      version: require('../zustand/version').useVersionStore.getState(),
      subtitle: require('../zustand/subtitle').useSubtitleStore.getState(),
      uiActions: require('../zustand/uiActions').useUiActions.getState(),
      materials: require('../zustand/fetchMaterials').default.getState(),
    };

    return this.safeStringify(stores);
  }

  getDeviceInfo() {
    const window = Dimensions.get('window');
    const screen = Dimensions.get('screen');

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

    // Handle arrays in the first argument by joining them with spaces
    const firstArg = Array.isArray(args[0]) ? args[0].join(' ') : args[0];

    let formattedMessage = [
      `[${timestamp}] [${level}] ${firstArg}`,
      ...args.slice(1),
    ];

    // Only generate stack trace when explicitly enabled (for debugging)
    if (this.includeStackTrace) {
      const stack = new Error().stack
        .split('\n')
        .slice(3)
        .map(line => line.trim())
        .join('\n    ');
      formattedMessage.push('\nStack Trace:\n    ' + stack + '\n');
    }

    return formattedMessage;
  }

  safeStringify(obj) {
    const seen = new WeakSet();
    try {
      return JSON.stringify(obj, (key, value) => {
        // Handle circular references by replacing them with a marker
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      });
    } catch (error) {
      return '[Unable to stringify object: ' + error.message + ']';
    }
  }

  async customLog(level, ...args) {
    if (!useDebugStore?.getState()?.debugMode) return;

    const formattedMessage = this.formatMessage(level, ...args);
    const message = formattedMessage
      .map(arg =>
        typeof arg === 'object' ? this.safeStringify(arg) : String(arg)
      )
      .join(' ');

    this.writeToFile(message);
  }

  async trace(...args) {
    if (!this.hasTag(args[0])) return;

    console.trace(...this.prepareConsoleMsg(args));
    await this.customLog('TRACE', ...args);
  }

  async debug(...args) {
    if (!this.hasTag(args[0])) return;

    console.debug(...this.prepareConsoleMsg(args));
    await this.customLog('DEBUG', ...args);
  }

  async info(...args) {
    if (!this.hasTag(args[0])) return;

    console.info(...this.prepareConsoleMsg(args));
    await this.customLog('INFO', ...args);
  }

  async warn(...args) {
    if (!this.hasTag(args[0])) return;

    console.warn(...this.prepareConsoleMsg(args));
    await this.customLog('WARN', ...args);
  }

  async error(...args) {
    if (!this.hasTag(args[0])) return;

    console.error(args);
    await this.customLog('ERROR', ...args);
    Sentry.captureException(new Error(args.join(', ')));
  }

  prepareConsoleMsg(args) {
    const firstArg = Array.isArray(args[0]) ? args[0].join(' ') : args[0];
    return [`[${firstArg}]`, ...args.slice(1)];
  }

  // Enable stack traces for debugging
  enableStackTraces(enabled = true) {
    this.includeStackTrace = enabled;
  }

  // Force immediate flush (for critical logs)
  async flush() {
    await this.flushBuffer();
  }

  destroy() {
    this.flushBuffer();
  }
}

const logger = new Logger();

export default logger;
