import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import logger from './logger';

const NAMESPACE = 'CallsBridge';

let NativeCall = null;
try {
  if (Platform.OS === 'ios') {
    NativeCall = NativeModules.CallManager;
  } else if (Platform.OS === 'android') {
    NativeCall = NativeModules.CallListenerModule;
  }

  // Log warning if native module is undefined
  if (!NativeCall) {
    logger.error(NAMESPACE, `Native module not found`);
  } else {
    logger.debug(NAMESPACE, `Native module found`, NativeCall);
  }
} catch (error) {
  logger.error(NAMESPACE, 'Error accessing native modules:', error);
}

const CallsBridge = {
  raw: NativeCall,

  /**
   * Get the appropriate event emitter for the current platform
   * @returns {Object} DeviceEventEmitter for Android, NativeEventEmitter for iOS
   */
  getEventEmitter: () => {
    try {
      if (Platform.OS === 'ios') {
        if (NativeCall) {
          logger.debug(NAMESPACE, 'Creating NativeEventEmitter for iOS');
          return new NativeEventEmitter(NativeCall);
        } else {
          logger.warn(NAMESPACE, 'iOS native module not available');
          return DeviceEventEmitter;
        }
      } else {
        // Android: Use DeviceEventEmitter as events are sent via SendEventToClient
        logger.debug(NAMESPACE, 'Using DeviceEventEmitter for Android');
        return DeviceEventEmitter;
      }
    } catch (error) {
      logger.error(NAMESPACE, 'Error creating event emitter', error);
      return DeviceEventEmitter;
    }
  },
};

export default CallsBridge;
