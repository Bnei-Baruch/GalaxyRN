import React, { useEffect, useState } from 'react';
import log from 'loglevel';
import { useSettingsStore } from './src/zustand/settings';
import PrepareRoom from './src/InRoom/PrepareRoom';
import Login from './src/auth/Login';
import { SettingsNotJoined } from './src/settings/SettingsNotJoined';
import { useMyStreamStore } from './src/zustand/myStream';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

import { Dimensions } from 'react-native';
import { memberItemWidth } from './src/InRoom/helper';
import { useInitsStore } from './src/zustand/inits';
import { baseStyles } from './src/constants';
import 'intl-pluralrules';
import { register } from '@formatjs/intl-pluralrules';
import './src/i18n/i18n';

if (!Intl.PluralRules) register();
log.setLevel('debug');

const App = () => {
  const [isListenerActive, setIsListenerActive] = useState(false);
  const { setIsPortrait }                       = useInitsStore();
  const { readyForJoin }                        = useSettingsStore();
  const { myInit }                              = useMyStreamStore();

  useEffect(() => {
    myInit();
    //RNSecureStorage.clear()
  }, []);

  useEffect(() => {
    const onChange = () => {
      const dim         = Dimensions.get('screen');
      const _isPortrait = dim.height >= dim.width;
      memberItemWidth.set(_isPortrait);
      setIsPortrait(_isPortrait);
    };
    //TODO: change after upgrade RN > 0.66
    if (!isListenerActive) {
      Dimensions.addEventListener('change', onChange);
      setIsListenerActive(true);
    }
    onChange();
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
