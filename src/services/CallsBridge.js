import { NativeEventEmitter, Platform } from 'react-native';
import logger from './logger';
import NativeCallManager from '../specs/NativeCallManager';
import NativeCallListenerModule from '../specs/NativeCallListenerModule';

const NAMESPACE = 'CallsBridge';

let NativeCall = null;
try {
  if (Platform.OS === 'ios') {
    NativeCall = NativeCallManager;
  } else if (Platform.OS === 'android') {
    NativeCall = NativeCallListenerModule;
  }

  // Log warning if native module is undefined
  if (!NativeCall) {
    logger.error(NAMESPACE, `Native module not found`);
  } else {
    logger.debug(NAMESPACE, `Native module found`, NativeCall);
  }
} catch (error) {
  logger.error(NAMESPACE, 'Error accessing native modules:', error);
}

const CallsBridge = {
  startCall: (handle) => {
    if (NativeCall && NativeCall.startCall) {
      NativeCall.startCall(handle);
    }
  },
  endCall: () => {
    if (NativeCall && NativeCall.endCall) {
      NativeCall.endCall();
    }
  },
  raw: NativeCall,

  /**
   * Subscribe to the native onCallStateChanged event.
   * iOS (CallManager) is a legacy RCTEventEmitter interop module, so it's
   * reached via NativeEventEmitter/addListener. Android (CallListenerModule)
   * is a real codegen TurboModule, so its EventEmitter field is called
   * directly.
   * @returns {?{remove: Function}} subscription, or null if unavailable
   */
  onCallStateChanged: handler => {
    if (!NativeCall) {
      logger.warn(NAMESPACE, 'onCallStateChanged is not available');
      return null;
    }
    if (Platform.OS === 'ios') {
      return new NativeEventEmitter(NativeCall).addListener(
        'onCallStateChanged',
        handler
      );
    }
    return NativeCall.onCallStateChanged(handler);
  },
};

export default CallsBridge;
