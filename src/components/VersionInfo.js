import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { baseStyles } from '../constants';
import { useVersionStore } from '../zustand/version';
import Text from './CustomText';

const VersionInfo = () => {
  const { t } = useTranslation();
  const { currentVersion, latestVersion, updateAvailable, openAppStore } =
    useVersionStore();

  if (!latestVersion) return null;

  return (
    <View style={[styles.container]}>
      <View style={styles.textContainer}>
        <Text style={[baseStyles.text, styles.text]}>
          {t('update.currentVersion')}: {currentVersion}
        </Text>
        {updateAvailable && (
          <Text style={[baseStyles.text, styles.text]}>
            {t('update.latestVersion')}: {latestVersion}
          </Text>
        )}
      </View>

      {updateAvailable && (
        <TouchableOpacity onPress={openAppStore} style={styles.button}>
          <Text style={baseStyles.text}>{t('update.updateNow')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  textContainer: {
    justifyContent: 'space-between',
  },
  text: {
    fontSize: 12,
  },
  button: {
    borderRadius: 5,
    backgroundColor: '#03A9F4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
    lineHeight: 40,
  },
});

export default VersionInfo;
