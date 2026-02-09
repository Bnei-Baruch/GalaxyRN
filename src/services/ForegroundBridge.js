import { NativeModules } from 'react-native';
import logger from './logger';

const NAMESPACE = 'ForegroundBridge';

const NativeForeground = NativeModules.ForegroundModule;

const ForegroundBridge = {
  startForegroundListener: async () => {
    if (NativeForeground && NativeForeground.startForegroundListener) {
      return await NativeForeground.startForegroundListener();
    } else {
      logger.warn(NAMESPACE, 'startForegroundListener is not available');
      return false;
    }
  },
  setMicOn: () => {
    if (NativeForeground && NativeForeground.setMicOn) {
      NativeForeground.setMicOn();
    } else {
      logger.warn(NAMESPACE, 'setMicOn is not available');
    }
  },
  setMicOff: () => {
    if (NativeForeground && NativeForeground.setMicOff) {
      NativeForeground.setMicOff();
    } else {
      logger.warn(NAMESPACE, 'setMicOff is not available');
    }
  },
  raw: NativeForeground,
};

export default ForegroundBridge;
