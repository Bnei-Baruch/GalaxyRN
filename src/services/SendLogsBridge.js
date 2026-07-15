import logger from './logger';
import NativeSendLogsModule from '../specs/NativeSendLogsModule';

const NAMESPACE = 'SendLogsBridge';

const NativeSendLogs = NativeSendLogsModule;

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
