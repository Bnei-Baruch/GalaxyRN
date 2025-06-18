import React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { register } from "@formatjs/intl-pluralrules";
import * as Sentry from "@sentry/react-native";

import "intl-pluralrules";
import "react-native-url-polyfill";

import { SENTRY_DSN } from "@env";

import "./src/i18n/i18n";

import CheckAuthentication from "./src/auth/CheckAuthentication";
import SentryErrorBoundary from "./src/libs/sentry/SentryErrorBoundary";
import AndroidPermissions from "./src/services/AndroidPermissions";
import InitApp from "./src/services/InitApp";
import VersionCheck from "./src/services/VersionCheck";

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  attachStacktrace: true,
  release: `GalaxyRN@${require("./package.json").version}`,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
  maxBreadcrumbs: 100,
  autoInitializeNativeSdk: true,
});
if (!Intl.PluralRules) register();

const App = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <SentryErrorBoundary>
          <VersionCheck>
            <AndroidPermissions>
              <CheckAuthentication>
                <InitApp />
              </CheckAuthentication>
            </AndroidPermissions>
          </VersionCheck>
        </SentryErrorBoundary>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Sentry.wrap(App);
