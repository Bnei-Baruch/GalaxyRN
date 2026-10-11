import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useInRoomStore } from '../zustand/inRoom';
import { useSettingsStore } from '../zustand/settings';

import logger from '../services/logger';

const NAMESPACE = 'ForegroundListener';

const ForegroundListener = () => {
  const { enterBackground, enterForeground } = useInRoomStore();

  useEffect(() => {

    logger.debug(NAMESPACE, 'useEffect', 'Setting up AppState listener for foreground/background changes');

    const handleAppStateChange = nextAppState => {
      logger.debug(NAMESPACE, 'handleAppStateChange', 'App state changed to:', nextAppState);
      if (nextAppState === 'background') {
        enterBackground();
      } else if (nextAppState === 'active') {
        enterForeground();
        useSettingsStore.getState().toggleIsPIPMode(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
};

export default ForegroundListener;
