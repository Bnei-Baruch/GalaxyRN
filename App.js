import { SENTRY_DSN } from '@env';
import { register } from '@formatjs/intl-pluralrules';
import * as Sentry from '@sentry/react-native';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import 'intl-pluralrules';
import 'react-native-url-polyfill';
import './src/i18n/i18n';

import AuthenticationCheck from './src/auth/AuthenticationCheck';
import NetConnectionModal from './src/components/ConnectionStatus/NetConnectionModal';
import SentryErrorBoundary from './src/libs/sentry/SentryErrorBoundary';
import { APP_SESSION } from './src/libs/sentry/constants';
import {
  finishTransaction,
  startTransaction,
} from './src/libs/sentry/sentryHelper';
import AndroidPermissions from './src/services/AndroidPermissions';
import logger from './src/services/logger';

const {
  version: appVersion,
  config: { isProduction },
} = require('./package.json');

const NAMESPACE = 'App';

if (!SENTRY_DSN) {
  logger.warn(NAMESPACE, 'Sentry DSN is not configured; skipping Sentry.init.');
} else {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: isProduction ? 0.2 : 1.0,
    profilesSampleRate: isProduction ? 0.1 : 1.0,
    environment: isProduction ? 'production' : 'staging',
    attachStacktrace: true,
    release: `GalaxyRN@${appVersion}`,
    dist: Platform.OS,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    maxBreadcrumbs: 100,
    autoInitializeNativeSdk: true,
    attachScreenshot: false,
    attachViewHierarchy: false,
  });
}

if (!Intl.PluralRules) register();

const App = () => {
  logger.debug(NAMESPACE, 'render');
  useEffect(() => {
    logger.debug(NAMESPACE, 'startTransaction');
    startTransaction(APP_SESSION, 'App Session', 'app.lifecycle');
    return () => {
      logger.debug(NAMESPACE, 'finishTransaction');
      finishTransaction(APP_SESSION);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SentryErrorBoundary>
        <AndroidPermissions>
          <NetConnectionModal />
          <AuthenticationCheck />
        </AndroidPermissions>
      </SentryErrorBoundary>
    </SafeAreaProvider>
  );
};

export default App;
