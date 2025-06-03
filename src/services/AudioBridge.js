import { NativeModules, Platform } from "react-native";
import logger from "./logger";

const NAMESPACE = 'AudioBridge';

// Find the appropriate native module based on platform
let NativeAudio = null;
if (Platform.OS === "ios") {
  NativeAudio = NativeModules.AudioManager;
  logger.debug(NAMESPACE, "NativeModules.AudioManager on iOS:", NativeModules.AudioManager);
  logger.debug(NAMESPACE, "NativeAudio on iOS:", NativeAudio);
} else if (Platform.OS === "android") {
  NativeAudio = NativeModules.AudioDeviceModule;
}

const AudioBridge = {
  initAudioDevices: () => {
    if (NativeAudio?.initAudioDevices) {
      NativeAudio.initAudioDevices();
    }
  },

  updateAudioDevices: (deviceId) => {
    if (Platform.OS === "ios" && NativeAudio?.handleDevicesChange) {
      NativeAudio.handleDevicesChange(deviceId);
    } else if (Platform.OS === "android" && NativeAudio?.handleDevicesChange) {
      NativeAudio.handleDevicesChange(deviceId);
    }
  },

  requestAudioFocus: () => {
    if (Platform.OS === "android" && NativeAudio?.requestAudioFocus) {
      NativeAudio.requestAudioFocus();
    }
  },

  activateAudioOutput: () => {
    if (Platform.OS === "ios" && NativeAudio?.activateAudioOutput) {
      // activate audio output after webRTC defined audio output
      setTimeout(() => {
        NativeAudio.activateAudioOutput();
      }, 500);
    }
  },

  abandonAudioFocus: () => {
    if (Platform.OS === "android" && NativeAudio?.abandonAudioFocus) {
      NativeAudio.abandonAudioFocus();
    } else if (Platform.OS === "ios" && NativeAudio?.releaseAudioFocus) {
      NativeAudio.releaseAudioFocus();
    }
  },

  switchAudioOutput: () => {
    logger.info(NAMESPACE, "Attempting to call switchAudioOutput");
    if (Platform.OS === "ios" && NativeAudio?.switchAudioOutput) {
      logger.debug(NAMESPACE, "Calling iOS native switchAudioOutput method");
      NativeAudio.switchAudioOutput();
      logger.debug(NAMESPACE, "iOS native switchAudioOutput method called");
    }
  },

  // Expose the raw native modules for event emitter
  raw: NativeAudio,
};

export default AudioBridge;
