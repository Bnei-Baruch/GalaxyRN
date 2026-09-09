import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useInRoomStore } from '../zustand/inRoom';

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
