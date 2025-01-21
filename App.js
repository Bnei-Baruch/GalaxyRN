import React, { useEffect } from 'react';
import log from 'loglevel';
import { useSettingsStore } from './src/zustand/settings';
import PrepareRoom from './src/InRoom/PrepareRoom';
import Login from './src/auth/Login';
import { SettingsNotJoined } from './src/settings/SettingsNotJoined';
import { useMyStreamStore } from './src/zustand/myStream';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';
import 'react-native-url-polyfill';
import { feedWidth } from './src/InRoom/helper';
import { useInitsStore } from './src/zustand/inits';
import { baseStyles } from './src/constants';
import 'intl-pluralrules';
import { register } from '@formatjs/intl-pluralrules';
import './src/i18n/i18n';

if (!Intl.PluralRules) register();
log.setLevel('debug');

const App = () => {
  const { setIsPortrait, initApp, terminateApp } = useInitsStore();
  const { readyForJoin }                         = useSettingsStore();
  const { myInit, myAbort }                      = useMyStreamStore();

  useEffect(() => {
    myInit();
    initApp();

    return () => {
      myAbort();
      terminateApp();
    };
  }, []);

  useEffect(() => {
    const onChange   = () => {
      const dim         = Dimensions.get('screen');
      const _isPortrait = dim.height >= dim.width;
      feedWidth.set(_isPortrait);
      setIsPortrait(_isPortrait);
    };
    let subscription = Dimensions.addEventListener('change', onChange);
    onChange();

    return () => subscription && subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={baseStyles.full}>
        <Login>
          {readyForJoin ? <PrepareRoom /> : <SettingsNotJoined />}
        </Login>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;
