import React from 'react';
import log from 'loglevel';
import CheckAuthentication from './src/auth/CheckAuthentication';
import 'react-native-url-polyfill';
import 'intl-pluralrules';
import { register } from '@formatjs/intl-pluralrules';
import './src/i18n/i18n';
import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN } from '@env';
import InitApp from './src/InitApp';
import { View } from 'react-native';

Sentry.init({
  dsn               : SENTRY_DSN,
  tracesSampleRate  : 1.0,
  profilesSampleRate: 1.0,
  environment       : process.env.NODE_ENV,
  attachStacktrace  : true,
});
if (!Intl.PluralRules) register();
log.setLevel('debug');

const App = () => {
  Sentry.captureException(new Error('Test error'));
  return (
    <View style={{ flex: 1 }}>
      <InitApp />
      <CheckAuthentication />
    </View>
  );
};

export default Sentry.wrap(App);
