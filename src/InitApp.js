import { useEffect } from "react";
import "react-native-url-polyfill";
import "intl-pluralrules";
import "./i18n/i18n";
import { useMyStreamStore } from "./zustand/myStream";
import { useInitsStore } from "./zustand/inits";
import { Dimensions } from "react-native";
import useForegroundListener from "./InRoom/useForegroundListener";
import useAudioDevicesStore from "./zustand/audioDevices";
import { setUser, setTag, addBreadcrumb } from "./sentryHelper";
import SentryErrorBoundary from "./components/SentryErrorBoundary";
import { withSentryMonitoring } from "./sentryHOC";

const InitAppContent = () => {
  const { myInit, myAbort } = useMyStreamStore();
  const { setIsPortrait, initApp, terminateApp } = useInitsStore();
  const { abortAudioDevices, initAudioDevices } = useAudioDevicesStore();

  useForegroundListener();

  useEffect(() => {
    const init = async () => {
      try {
        addBreadcrumb('initialization', 'Starting app initialization');
        
        // Set global tags for better error context
        setTag('app_version', require('../package.json').version);
        setTag('platform', 'react-native');
        
        await myInit();
        addBreadcrumb('initialization', 'myInit completed');
        
        await initApp();
        addBreadcrumb('initialization', 'initApp completed');
        
        initAudioDevices();
        addBreadcrumb('initialization', 'Audio devices initialized');
        
        // If you have user information, you can set it for Sentry
        // This could be moved to after authentication
        // Example: setUser({ id: user.id, username: user.username });
      } catch (error) {
        console.error('Error during initialization:', error);
        throw error; // Let the error boundary catch this
      }
    };
    
    init();
    
    return () => {
      myAbort();
      terminateApp();
      abortAudioDevices();
    };
  }, []);

  useEffect(() => {
    const onChange = () => {
      const dim = Dimensions.get("screen");
      const _isPortrait = dim.height >= dim.width;
      setIsPortrait(_isPortrait);
    };
    let subscription = Dimensions.addEventListener("change", onChange);
    onChange();

    return () => subscription && subscription.remove();
  }, []);

  return null;
};

// Wrap the component with Sentry monitoring
const MonitoredInitApp = withSentryMonitoring(InitAppContent);

const InitApp = () => {
  return (
    <SentryErrorBoundary>
      <MonitoredInitApp />
    </SentryErrorBoundary>
  );
};

export default InitApp;
