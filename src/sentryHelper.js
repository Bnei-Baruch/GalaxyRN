import * as Sentry from '@sentry/react-native';
import { SENTRY_LEVEL } from '@env';

export const sendSentry = (msg, level = 'info') => {
  if (!__DEV__ && SENTRY_LEVEL === 'error')
    return;
  Sentry.captureMessage(msg, { level });
};