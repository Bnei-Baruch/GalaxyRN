// External libraries
import { create } from 'zustand';

// Shared modules
import logger from '../services/logger';
import { setToStorage } from '../shared/tools';

import { NativeModules } from 'react-native';

const NativeDebug = NativeModules.LoggerModule;

export const useDebugStore = create((set, get) => ({
  debugMode: false,

  toggleDebugMode: (debugMode = !get().debugMode) => {
    setToStorage('debugMode', debugMode);
    if (NativeDebug?.setDebugMode) {
      NativeDebug.setDebugMode(debugMode);
    }
    if (debugMode) {
      logger.initializeLogFile();
    } else {
      logger.cleanDirectory(logger.appLogsDir);
    }
    set({ debugMode });
  },
}));
