import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import logger from './logger';

const NAMESPACE = 'AudioBridge';

// Find the appropriate native module based on platform
let NativeAudio = null;
if (Platform.OS === 'ios') {
  NativeAudio = NativeModules.AudioManager;
  logger.debug(
    NAMESPACE,
    'NativeModules.AudioManager on iOS:',
    NativeModules.AudioManager
  );
  logger.debug(NAMESPACE, 'NativeAudio on iOS:', NativeAudio);
} else if (Platform.OS === 'android') {
  NativeAudio = NativeModules.AudioDeviceModule;
  logger.debug(NAMESPACE, 'NativeModules on Android:', NativeModules);
}

const AudioBridge = {
  /**
   * Get the appropriate event emitter for the current platform
   * @returns {Object} DeviceEventEmitter for Android, NativeEventEmitter for iOS
   */
  getEventEmitter: () => {
    try {
      if (Platform.OS === 'ios') {
        if (NativeAudio) {
          logger.debug(NAMESPACE, 'Creating NativeEventEmitter for iOS');
          return new NativeEventEmitter(NativeAudio);
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

  initAudioDevices: () => {
    logger.debug(NAMESPACE, 'initAudioDevices');
    if (NativeAudio?.initAudioDevices) {
      NativeAudio.initAudioDevices();
    }
  },

  updateAudioDevices: deviceId => {
    logger.debug(NAMESPACE, 'updateAudioDevices', deviceId);
    if (Platform.OS === 'ios' && NativeAudio?.handleDevicesChange) {
      NativeAudio.handleDevicesChange(deviceId);
    } else if (Platform.OS === 'android' && NativeAudio?.handleDevicesChange) {
      NativeAudio.handleDevicesChange(deviceId);
    }
  },

  requestAudioFocus: () => {
    logger.debug(NAMESPACE, 'requestAudioFocus');
    if (Platform.OS === 'android' && NativeAudio?.requestAudioFocus) {
      NativeAudio.requestAudioFocus();
    }
  },

  activateAudioOutput: () => {
    logger.debug(NAMESPACE, 'activateAudioOutput');
    if (Platform.OS === 'ios' && NativeAudio?.activateAudioOutput) {
      BackgroundTimer.setTimeout(() => {
        NativeAudio.activateAudioOutput();
      }, 500);
    }
  },

  abandonAudioFocus: () => {
    logger.debug(NAMESPACE, 'abandonAudioFocus');
    if (Platform.OS === 'android' && NativeAudio?.abandonAudioFocus) {
      NativeAudio.abandonAudioFocus();
    } else if (Platform.OS === 'ios' && NativeAudio?.releaseAudioFocus) {
      NativeAudio.releaseAudioFocus();
    }
  },

  switchAudioOutput: () => {
    logger.debug(NAMESPACE, 'switchAudioOutput');
    if (Platform.OS === 'ios' && NativeAudio?.switchAudioOutput) {
      logger.debug(NAMESPACE, 'Calling iOS native switchAudioOutput method');
      NativeAudio.switchAudioOutput();
      logger.debug(NAMESPACE, 'iOS native switchAudioOutput method called');
    }
  },

  // Expose the raw native modules for event emitter
  raw: NativeAudio,
};

export default AudioBridge;
