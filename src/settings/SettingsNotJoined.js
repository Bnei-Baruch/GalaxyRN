import * as React from 'react';
import { View } from 'react-native';
import MqttConnectionModal from '../components/ConnectionStatus/MqttConnectionModal';
import { baseStyles } from '../constants';
import logger from '../services/logger';
import { useInitsStore } from '../zustand/inits';
import { SettingsNotJoinedLandscape } from './SettingsNotJoinedLandscape';
import { SettingsNotJoinedPortrait } from './SettingsNotJoinedPortrait';

const NAMESPACE = 'SettingsNotJoined';
export const SettingsNotJoined = () => {
  logger.debug(NAMESPACE, 'SettingsNotJoined');
  const { isPortrait } = useInitsStore();

  const content = isPortrait ? (
    <SettingsNotJoinedPortrait />
  ) : (
    <SettingsNotJoinedLandscape />
  );
  return (
    <View style={baseStyles.full}>
      {content}
      <MqttConnectionModal />
    </View>
  );
};
