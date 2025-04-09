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
      NativeAudio.initAudioDevices();
    } else {
      console.warn('initAudioDevices (iOS) is not available');
      if (callback) {
        callback(new Error('Method not available'), null);
      }
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
  hasHeadphones: (callback) => {
    if (NativeAudio && NativeAudio.hasHeadphones) {
      NativeAudio.hasHeadphones(callback);
    } else {
      console.warn('hasHeadphones is not available on this platform');
      callback(new Error('Method not available'), null);
    }
  },

  updateAudioDevices: (deviceId, callback) => {
    if (Platform.OS === 'ios') {
      if (NativeAudio && NativeAudio.handleDevicesChange) {
        NativeAudio.handleDevicesChange(deviceId, callback);
      } else {
        console.warn('updateAudioDevices (iOS) is not available');
        if (callback) {
          callback(new Error('Method not available'), null);
        }
      }
    } else if (Platform.OS === 'android') {
      if (NativeAudio && NativeAudio.handleDevicesChange) {
        NativeAudio.handleDevicesChange(deviceId);
        if (callback) {
          // Android doesn't use callback directly, so we simulate success since the event will come through the event listener
          callback(null, { status: 'pending', message: 'Request sent to Android native module' });
        }
      } else {
        console.warn('updateAudioDevices (Android) is not available');
        if (callback) {
          callback(new Error('Method not available'), null);
        }
      }
    } else {
      console.warn('updateAudioDevices is not available on this platform');
      if (callback) {
        callback(new Error('Method not available'), null);
      }
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
  // Switch to a specific audio output group
// group values:
// 0 - earpiece
// 1 - speaker 
// 2 - bluetooth
// 3 - headphones
// 4 - external
switchAudioOutput: () => {
  return new Promise((resolve, reject) => {
    if (NativeAudio && NativeAudio.switchAudioOutput) {
      NativeAudio.switchAudioOutput((error, result) => {
        console.log("[audioDevices] switchAudioOutput result", result);
        if (error) {
          reject('Error switching audio output: ' + error);
          return;
        }
        
        console.log('Audio output switched successfully:', result);
        resolve(result);
      });
    } else {
      console.warn('switchAudioOutput is not available on this platform');
      reject(new Error('Method not available'));
    }
  });
},

  // Expose the raw native modules for any advanced use cases
  raw: NativeAudio
};

export default AudioBridge; 