import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { baseStyles } from '../constants';
import { useAndroidPermissionsStore } from '../zustand/androidPermissions';
import logger from './logger';

const isAndroid = Platform.OS === 'android';

const NAMESPACE = 'AndroidPermissions';

const AndroidPermissions = ({ children }) => {
  const permReady = useAndroidPermissionsStore(state => state.permReady);

  useEffect(() => {
    if (!isAndroid) {
      return;
    }

    const { initPermissions, terminatePermissions } =
      useAndroidPermissionsStore.getState();
    initPermissions();

    return () => {
      terminatePermissions();
    };
  }, []);

  if (isAndroid && !permReady) {
    logger.debug(NAMESPACE, 'Permissions not ready, waiting...');
    return null;
  }

  return <View style={baseStyles.full}>{children}</View>;
};

export default AndroidPermissions;
