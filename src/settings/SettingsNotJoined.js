import * as React from 'react';
import { useInitsStore } from '../zustand/inits';
import { SettingsNotJoinedPortrait } from './SettingsNotJoinedPortrait';
import { SettingsNotJoinedLandscape } from './SettingsNotJoinedLandscape';

export const SettingsNotJoined = () => {
  const { isPortrait } = useInitsStore();
  return isPortrait ? <SettingsNotJoinedPortrait /> : <SettingsNotJoinedLandscape />;
};
