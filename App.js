import { SENTRY_DSN } from '@env';
import { register } from '@formatjs/intl-pluralrules';
import * as Sentry from '@sentry/react-native';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

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

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  attachStacktrace: true,
  release: `GalaxyRN@${require('./package.json').version}`,
  dist: Platform.OS,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
  maxBreadcrumbs: 100,
  autoInitializeNativeSdk: true,
});

if (!Intl.PluralRules) register();

const NAMESPACE = 'App';

const App = () => {
  logger.debug(NAMESPACE, 'render');
  useEffect(() => {
    logger.debug(NAMESPACE, 'startTransaction');
    startTransaction(APP_SESSION);
    return () => {
      logger.debug(NAMESPACE, 'finishTransaction');
      finishTransaction(APP_SESSION);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <SentryErrorBoundary>
          <AndroidPermissions>
            <NetConnectionModal />
            <AuthenticationCheck />
          </AndroidPermissions>
        </SentryErrorBoundary>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;
