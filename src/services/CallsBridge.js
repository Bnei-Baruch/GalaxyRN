import { NativeModules, Platform } from "react-native";
import { warn, error } from "./logger";

const NAMESPACE = 'CallsBridge';

let NativeCall = null;
try {
  if (Platform.OS === "ios") {
    NativeCall = NativeModules.CallManager;
  } else if (Platform.OS === "android") {
    NativeCall = NativeModules.CallListenerModule;
  }

  // Log warning if native module is undefined
  if (!NativeCall) {
    warn(NAMESPACE, `Native module not found for platform ${Platform.OS}`);
  }
} catch (error) {
  error(NAMESPACE, "Error accessing native modules:", error);
}

const CallsBridge = {
  raw: NativeCall,
};

export default CallsBridge;
