import React from 'react';
import log from 'loglevel';
import { useSettingsStore } from './src/zustand/settings';
import InRoom from './src/InRoom/InRoom';
import Login from './src/auth/Login';
import { SettingsNotJoined } from './src/settings/SettingsNotJoined';

log.setLevel('debug');

const App = () => {
  const { readyForJoin } = useSettingsStore();

  return (
    <Login>
      {readyForJoin ? <InRoom /> : <SettingsNotJoined />}
    </Login>
  );
};
export default App;