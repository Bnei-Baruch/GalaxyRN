import React, { useEffect } from 'react';
import log from 'loglevel';
import { useSettingsStore } from './src/zustand/settings';
import InRoom from './src/InRoom/InRoom';
import Login from './src/auth/Login';
import { SettingsNotJoined } from './src/settings/SettingsNotJoined';
import { useMyStreamStore } from './src/zustand/myStream';
import RNSecureStorage from 'rn-secure-storage';

log.setLevel('debug');

const App = () => {
  const { readyForJoin } = useSettingsStore();
  const { init }         = useMyStreamStore();

  useEffect(() => {
    init();
    //RNSecureStorage.clear()
  }, []);

  return (
    <Login>
      {readyForJoin ? <InRoom /> : <SettingsNotJoined />}
    </Login>
  );
};
export default App;
