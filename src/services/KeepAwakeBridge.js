import logger from "./logger";
import NativeKeepAwakeModule from '../specs/NativeKeepAwakeModule';

const NAMESPACE = 'KeepAwakeBridge';

const KeepAwakeBridge = {
  keepScreenOn: () => {
    return new Promise((resolve, reject) => {
      if (NativeKeepAwakeModule && NativeKeepAwakeModule.keepScreenOn) {
        NativeKeepAwakeModule.keepScreenOn();
        resolve(true);
      } else {
        logger.warn(NAMESPACE, 'keepScreenOn is not available');
        reject(new Error('Method not available'));
      }
    });
  },
  releaseScreenOn: () => {
    if (NativeKeepAwakeModule && NativeKeepAwakeModule.releaseScreenOn) {
      NativeKeepAwakeModule.releaseScreenOn();
    } else {
      logger.warn(NAMESPACE, 'releaseScreenOn is not available on this platform');
    }
  },
  raw: NativeKeepAwakeModule
};

export default KeepAwakeBridge;
