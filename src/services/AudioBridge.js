import { NativeModules, Platform } from "react-native";

// Find the appropriate native module based on platform
let NativeAudio = null;
if (Platform.OS === "ios") {
  NativeAudio = NativeModules.AudioManager;
} else if (Platform.OS === "android") {
  NativeAudio = NativeModules.AudioDeviceModule;
}

const AudioBridge = {
  initAudioDevices: () => {
    if (NativeAudio && NativeAudio.initAudioDevices) {
      NativeAudio.initAudioDevices();
      return Promise.resolve({ status: "success" });
    } else {
      console.log(
        "Using stub implementation for initAudioDevices on platform: " +
          Platform.OS
      );
      return Promise.resolve({ status: "success" });
    }
  },

  updateAudioDevices: (deviceId, callback) => {
    if (Platform.OS === "ios") {
      if (NativeAudio && NativeAudio.handleDevicesChange) {
        NativeAudio.handleDevicesChange(deviceId);
      } else if (callback) {
        callback(null, { status: "success" });
      }
    } else if (Platform.OS === "android") {
      if (NativeAudio && NativeAudio.handleDevicesChange) {
        NativeAudio.handleDevicesChange(deviceId);
        if (callback) {
          callback(null, { status: "pending" });
        }
      } else if (callback) {
        callback(null, { status: "success" });
      }
    } else if (callback) {
      callback(null, { status: "success" });
    }
  },

  requestAudioFocus: () => {
    if (Platform.OS === "android" && NativeAudio?.requestAudioFocus) {
      NativeAudio.requestAudioFocus();
    }
  },

  abandonAudioFocus: () => {
    if (Platform.OS === "android" && NativeAudio?.abandonAudioFocus) {
      NativeAudio.abandonAudioFocus();
    }
  },

  switchAudioOutput: () => {
    if (Platform.OS === "ios" && NativeAudio?.switchAudioOutput) {
      NativeAudio.switchAudioOutput();
    }
  },

  // Expose the raw native modules for event emitter
  raw: NativeAudio || {
    addListener: () => {},
    removeListeners: () => {},
  },
};

export default AudioBridge;
