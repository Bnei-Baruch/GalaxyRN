import React, { useEffect } from 'react';
import log from 'loglevel';
import { useSettingsStore } from './src/zustand/settings';
import PrepareRoom from './src/InRoom/PrepareRoom';
import Login from './src/auth/Login';
import { SettingsNotJoined } from './src/settings/SettingsNotJoined';
import { useMyStreamStore } from './src/zustand/myStream';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

log.setLevel('debug');

const App = () => {
  const { readyForJoin } = useSettingsStore();
  const { myInit }       = useMyStreamStore();

  useEffect(() => {
    myInit();
    //RNSecureStorage.clear()
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Login>
          {readyForJoin ? <PrepareRoom /> : <SettingsNotJoined />}
        </Login>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
export default App;
