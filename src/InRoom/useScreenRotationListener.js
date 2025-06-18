import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useInitsStore } from '../zustand/inits';

const useScreenRotationListener = () => {
  const { setIsPortrait } = useInitsStore();

  useEffect(() => {
    const handleOrientationChange = ({ window }) => {
      const { width, height } = window;
      const isPortrait = height > width;
      setIsPortrait(isPortrait);
    };

    const subscription = Dimensions.addEventListener(
      'change',
      handleOrientationChange
    );

    return () => {
      subscription?.remove();
    };
  }, [setIsPortrait]);

  return null;
};

export default useScreenRotationListener;
