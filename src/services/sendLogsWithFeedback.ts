import { Alert } from 'react-native';
import type { TFunction } from 'i18next';
import SendLogsBridge from './SendLogsBridge';
import logger from './logger';

const NAMESPACE = 'SendLogs';

// Ignore repeated taps while an upload is in progress
let sending = false;

export const sendLogsWithFeedback = async (
  email: string | undefined,
  t: TFunction
): Promise<void> => {
  if (sending) return;
  sending = true;
  try {
    await SendLogsBridge.sendLogs(email);
    Alert.alert(t('logs.sent'));
  } catch (error) {
    logger.error(NAMESPACE, 'Error sending logs', error);
    Alert.alert(t('logs.sendFailed'), String((error as Error)?.message ?? ''));
  } finally {
    sending = false;
  }
};
