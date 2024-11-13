import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useShidurStore } from '../zustand/shidur';
import { useInitsStore } from '../zustand/inits';
import WIP from '../components/WIP';
import { Shidur } from './Shidur';
import { Quads } from './Quads';
import { useSettingsStore } from '../zustand/settings';

export const Shidurs = () => {
  const { cleanJanus, initJanus, janusReady } = useShidurStore();
  const { isPortrait }                         = useInitsStore();
  const { isBroadcast, showGroups }            = useSettingsStore();

  useEffect(() => {
    initJanus();
    return () => {
      cleanJanus();
    };
  }, []);

  return (
    <WIP isReady={janusReady}>
      <View style={isPortrait ? styles.portrait : styles.landscape}>
        {isBroadcast && <Shidur />}
        {showGroups && <Quads />}
      </View>
    </WIP>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  portrait : { width: '100%' },
  landscape: { maxWidth: '50%' }
});
