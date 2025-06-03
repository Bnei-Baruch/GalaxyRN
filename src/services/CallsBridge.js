import { NativeModules, Platform } from "react-native";
import logger from "./logger";

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
    logger.warn(NAMESPACE, `Native module not found`, NativeModules);
  }
} catch (error) {
  logger.error(NAMESPACE, "Error accessing native modules:", error);
}

const CallsBridge = {
  raw: NativeCall,
};

export default CallsBridge;
