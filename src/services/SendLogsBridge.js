import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import logger from './logger';
import { flushLogs, getVerboseUntil, isVerbose } from './logFile';
import NativeSendLogsModule from '../specs/NativeSendLogsModule';

const NAMESPACE = 'SendLogsBridge';

const NativeSendLogs = NativeSendLogsModule;

const appVersion = require('../../package.json').version;

const SendLogsBridge = {
  // Uploads the persistent log file to Sentry as an attachment.
  // Resolves with the Sentry event id, throws on failure.
  sendLogs: async email => {
    if (!NativeSendLogs) {
      logger.error(NAMESPACE, 'NativeSendLogs is not available');
      throw new Error('NativeSendLogs is not available');
    }

    const verbose = isVerbose();
    logger.info(NAMESPACE, 'Sending logs', { email, verbose });

    // appendLogs and readLogs are queued in order on the native side, so the
    // flushed lines are included in what readLogs returns
    flushLogs();
    const logs = await NativeSendLogs.readLogs();
    if (!logs) {
      throw new Error('No logs available');
    }

    const eventId = Sentry.withScope(scope => {
      scope.setLevel('error');
      // Shown as the culprit (subtitle) in Sentry
      scope.setTransactionName(`Send logs (${Platform.OS})`);
      scope.setTag('email', email);
      scope.setTag('user_logs', 'true');
      scope.setFingerprint(['user-logs', email || 'unknown']);
      scope.setContext('logs', {
        verbose,
        verboseUntil: verbose
          ? new Date(getVerboseUntil()).toISOString()
          : null,
        sizeBytes: logs.length,
        appVersion,
        platform: Platform.OS,
        osVersion: String(Platform.Version),
      });
      scope.addAttachment({
        filename: 'application-logs.txt',
        data: logs,
        contentType: 'text/plain',
      });
      return Sentry.captureEvent({
        message: `User full logs`,
      });
    });

    await Sentry.flush();
    logger.info(NAMESPACE, 'Logs sent', eventId);
    return eventId;
  },
};

export default SendLogsBridge;
