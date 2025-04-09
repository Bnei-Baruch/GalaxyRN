import { NativeModules, Platform } from 'react-native';

let NativeAudio = null;
if (Platform.OS === 'ios') {
  NativeAudio = NativeModules.CallManager;
} else if (Platform.OS === 'android') {
  NativeAudio = NativeModules.CallListenerModule;
}

const CallsBridge = {
  raw: NativeAudio
};

export default CallsBridge; 