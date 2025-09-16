import * as React from 'react';
import logger from '../services/logger';
import { useInitsStore } from '../zustand/inits';
import { SettingsNotJoinedLandscape } from './SettingsNotJoinedLandscape';
import { SettingsNotJoinedPortrait } from './SettingsNotJoinedPortrait';

const NAMESPACE = 'SettingsNotJoined';
export const SettingsNotJoined = () => {
  logger.debug(NAMESPACE, 'SettingsNotJoined');
  const { isPortrait } = useInitsStore();
  return isPortrait ? (
    <SettingsNotJoinedPortrait />
  ) : (
    <SettingsNotJoinedLandscape />
  );
};
