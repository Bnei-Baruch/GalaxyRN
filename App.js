import React, { useState, useEffect } from "react";
import log from "loglevel";
import CheckAuthentication from "./src/auth/CheckAuthentication";
import "react-native-url-polyfill";
import "intl-pluralrules";
import { register } from "@formatjs/intl-pluralrules";
import "./src/i18n/i18n";
import * as Sentry from "@sentry/react-native";
import { SENTRY_DSN } from "@env";
import InitApp from "./src/InitApp";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useInitsStore } from "./src/zustand/inits";
import WIP from "./src/components/WIP";

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 0.0,
  profilesSampleRate: 0.0,
  environment: process.env.NODE_ENV,
  attachStacktrace: true,
});
if (!Intl.PluralRules) register();
log.setLevel("info");

const App = () => {
  const [permissionsReady, setPermissionsReady] = useState(false);

  useEffect(() => {
    try {
      // Initial check
      if (typeof useInitsStore === "function") {
        const state = useInitsStore.getState();
        if (state && typeof state === "object") {
          setPermissionsReady(state.permissionsReady || false);
        }
      }

      // Subscribe to future changes
      const unsubscribe = useInitsStore.subscribe(
        (state) => {
          setPermissionsReady(state.permissionsReady || false);
          log.info(`[App] Permission state updated: ${state.permissionsReady}`);
        }
      );

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      log.error("[App] Error setting up permission subscription:", error);
      // Default to true to prevent app from being stuck in loading state
      setPermissionsReady(true);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <WIP isReady={permissionsReady}>
          <InitApp />
          <CheckAuthentication />
        </WIP>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default Sentry.wrap(App);
