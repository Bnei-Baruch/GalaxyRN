import { NativeModules, Platform } from 'react-native';

let NativeAudio = null;
if (Platform.OS === 'ios') {
  NativeAudio = NativeModules.KeepAwakeModule;
} else if (Platform.OS === 'android') {
  NativeAudio = NativeModules.WakeLockModule;
}

const WakeLockBridge = {
  keepScreenOn: () => {
    return new Promise((resolve, reject) => {
      if (NativeAudio && NativeAudio.keepScreenOn) {
        NativeAudio.keepScreenOn();
        resolve(true);
      } else {
        console.warn('keepScreenOn is not available');
        reject(new Error('Method not available'));
      }
    });
  },
  releaseScreenOn: () => {
    if (NativeAudio && NativeAudio.releaseScreenOn) {
      NativeAudio.releaseScreenOn();
    } else {
      console.warn('releaseScreenOn is not available on this platform');
    }
  },
  raw: NativeAudio
};

export default WakeLockBridge; 