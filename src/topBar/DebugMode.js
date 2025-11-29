import * as React from 'react';

import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import { useSettingsStore } from '../zustand/settings';

export const DebugModeBtn = () => {
  const { debugMode, toggleDebugMode } = useSettingsStore();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={baseStyles.text}>{t('bottomBar.debugMode')}</Text>
      <Switch onValueChange={toggleDebugMode} value={debugMode} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
