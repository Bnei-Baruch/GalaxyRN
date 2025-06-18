import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useInRoomStore } from '../zustand/inRoom';

const useForegroundListener = () => {
  const { enterBackground, enterForeground } = useInRoomStore();

  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background') {
        enterBackground();
      } else if (nextAppState === 'active') {
        enterForeground();
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
};

export default useForegroundListener;
