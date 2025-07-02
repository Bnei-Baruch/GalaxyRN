import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { useShidurStore } from '../zustand/shidur';

export const OriginalSwitch = () => {
  const { toggleIsOriginal, audio } = useShidurStore();

  const { t } = useTranslation();
  const isOriginal = audio.key === 'wo_original';

  const toggle = () => toggleIsOriginal();

  return (
    <View style={styles.container}>
      <Switch
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={isOriginal ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggle}
        value={isOriginal}
      />
      <Text style={styles.title}>
        {t(`shidur.${isOriginal ? 'original' : 'translated'}`)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 12,
  },
});
