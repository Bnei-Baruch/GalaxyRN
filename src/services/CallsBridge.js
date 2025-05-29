import { NativeModules, Platform } from "react-native";
import log from "loglevel";

let NativeCall = null;
try {
  if (Platform.OS === "ios") {
    NativeCall = NativeModules.CallManager;
  } else if (Platform.OS === "android") {
    NativeCall = NativeModules.CallListenerModule;
  }

  // Log warning if native module is undefined
  if (!NativeCall) {
    log.warn(
      `[CallsBridge] Native module not found for platform ${Platform.OS}`
    );
  }
} catch (error) {
  log.error("[CallsBridge] Error accessing native modules:", error);
}

const CallsBridge = {
  raw: NativeCall,
};

export default CallsBridge;
