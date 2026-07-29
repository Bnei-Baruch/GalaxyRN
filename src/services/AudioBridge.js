import { NativeEventEmitter, Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import logger from './logger';
import NativeAudioManager from '../specs/NativeAudioManager';
import NativeAudioDeviceModule from '../specs/NativeAudioDeviceModule';

const NAMESPACE = 'AudioBridge';

// Find the appropriate native module based on platform
let NativeAudio = null;
if (Platform.OS === 'ios') {
  NativeAudio = NativeAudioManager;
  logger.debug(NAMESPACE, 'NativeAudio on iOS:', NativeAudio);
} else if (Platform.OS === 'android') {
  NativeAudio = NativeAudioDeviceModule;
  logger.debug(NAMESPACE, 'NativeAudio on Android:', NativeAudio);
}

const AudioBridge = {
  /**
   * Subscribe to the native updateAudioDevice event.
   * iOS (AudioManager) is a legacy RCTEventEmitter interop module, so it's
   * reached via NativeEventEmitter/addListener. Android (AudioDeviceModule)
   * is a real codegen TurboModule, so its EventEmitter field is called
   * directly.
   * @returns {?{remove: Function}} subscription, or null if unavailable
   */
  onUpdateAudioDevice: handler => {
    if (!NativeAudio) {
      logger.warn(NAMESPACE, 'updateAudioDevice is not available');
      return null;
    }
    if (Platform.OS === 'ios') {
      return new NativeEventEmitter(NativeAudio).addListener(
        'updateAudioDevice',
        handler
      );
    }
    return NativeAudio.updateAudioDevice(handler);
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
