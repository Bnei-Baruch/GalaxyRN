import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import Text from '../components/CustomText';
import { useShidurStore } from '../zustand/shidur';

export const OriginalSwitch = () => {
  const { toggleIsOriginal, audio } = useShidurStore();

  const { t } = useTranslation();
  const isOriginal = audio?.key === 'wo_original';

  const toggle = () => toggleIsOriginal();

  return (
    <View style={styles.container}>
      <Switch
        // trackColor={{ false: '#767577', true: '#81b0ff' }}
        // thumbColor={isOriginal ? '#f4f3f4' : '#f5dd4b'}
        // ios_backgroundColor="#3e3e3e"
        onValueChange={toggle}
        value={!isOriginal}
      />
      <Text style={styles.title}>
        {t(`shidur.${!isOriginal ? 'translationOn' : 'translationOff'}`)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  title: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    maxWidth: 70,
    textAlign: 'center',
  },
});
