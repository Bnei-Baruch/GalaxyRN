import { NativeModules, Platform } from 'react-native';

let NativeAudio = null;
if (Platform.OS === 'ios') {
  NativeAudio = NativeModules.AudioManager;
} else if (Platform.OS === 'android') {
  NativeAudio = NativeModules.AudioDeviceModule;
}

const AudioBridge = {
  initAudioDevices: (callback) => {
    if (NativeAudio && NativeAudio.initAudioDevices) {
      NativeAudio.initAudioDevices(callback);
    } else {
      console.warn('getAvailableAudioDevices is not available on this platform');
      callback(new Error('Method not available'), null);
    }
  },
  getAudioDevices: (callback) => {
    if (NativeAudio && NativeAudio.getAvailableAudioDevices) {
      NativeAudio.getAvailableAudioDevices(callback);
    } else {
      console.warn('getAvailableAudioDevices is not available on this platform');
      callback(new Error('Method not available'), null);
    }
  },


  setAudioOutput: (deviceType, callback) => {
    if (NativeAudio && NativeAudio.setAudioOutput) {
      NativeAudio.setAudioOutput(deviceType, callback);
    } else {
      console.warn('setAudioOutput is not available on this platform');
      callback(new Error('Method not available'), null);
    }
  },
  

  requestAudioFocus: () => {
    if (Platform.OS === 'android' && NativeAudio?.requestAudioFocus) {
      NativeAudio.requestAudioFocus();
    }
  },

  abandonAudioFocus: () => {
    if (Platform.OS === 'android' && NativeAudio?.abandonAudioFocus) {
      NativeAudio.abandonAudioFocus();
    }
  },

  // Expose the raw native modules for any advanced use cases
  raw: NativeAudio
};

export default AudioBridge; 