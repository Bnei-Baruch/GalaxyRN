import React, { useEffect } from 'react';
import log from 'loglevel';
import { useSettingsStore } from './src/zustand/settings';
import InRoom from './src/InRoom/InRoom';
import Login from './src/auth/Login';
import { SettingsNotJoined } from './src/settings/SettingsNotJoined';
import RNSecureStorage from 'rn-secure-storage';

log.setLevel('debug');

const App = () => {
  const { readyForJoin } = useSettingsStore();
  useEffect(() => {
    //RNSecureStorage.clear()
  }, []);

  return (
    <Login>
      {readyForJoin ? <InRoom /> : <SettingsNotJoined />}
    </Login>
  );
};
export default App;