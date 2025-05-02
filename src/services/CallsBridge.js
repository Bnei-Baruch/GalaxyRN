import { NativeModules, Platform } from 'react-native';
import log from 'loglevel';

let NativeAudio = null;
try {
  if (Platform.OS === 'ios') {
    NativeAudio = NativeModules.CallManager;
  } else if (Platform.OS === 'android') {
    NativeAudio = NativeModules.CallListenerModule;
  }
  
  // Log warning if native module is undefined
  if (!NativeAudio) {
    log.warn(`[CallsBridge] Native module not found for platform ${Platform.OS}`);
  }
} catch (error) {
  log.error('[CallsBridge] Error accessing native modules:', error);
}

const CallsBridge = {
  raw: NativeAudio
};

export default CallsBridge; 