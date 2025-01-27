import * as React from 'react';
import { useInitsStore } from '../zustand/inits';
import { SettingsNotJoinedPortrait } from './SettingsNotJoinedPortrait';
import { SettingsNotJoinedLandscape } from './SettingsNotJoinedLandscape';

export const SettingsNotJoined = () => {
  const { isPortrait, isBridgeReady } = useInitsStore();
  if (!isBridgeReady)
    return null;
  return isPortrait ? <SettingsNotJoinedPortrait /> : <SettingsNotJoinedLandscape />;
};
