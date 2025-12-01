import { NativeModules } from 'react-native';
import logger from './logger';

const NAMESPACE = 'SendLogsBridge';

let NativeSendLogs = null;
NativeSendLogs = NativeModules.SendLogsModule;

const SendLogsBridge = {
  sendLogs: async email => {
    if (!NativeSendLogs) {
      logger.error(NAMESPACE, 'NativeSendLogs is not available');
      throw new Error('NativeSendLogs is not available');
    }

    try {
      return await NativeSendLogs.sendLogs(email);
    } catch (error) {
      logger.error(NAMESPACE, 'Error sending logs', error);
    }
  },
};

export default SendLogsBridge;
