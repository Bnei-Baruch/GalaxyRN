import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { topMenuBtns } from '../bottomBar/moreBtns/helper';
import { baseStyles } from '../constants';
import { useVersionStore } from '../zustand/version';
import Text from './CustomText';
const VersionInfo = () => {
  const { t } = useTranslation();
  const { currentVersion, latestVersion, updateAvailable, openAppStore } =
    useVersionStore();

  if (!latestVersion) return null;

  return (
    <>
      <View style={[topMenuBtns.btn, styles.container]}>
        <Text style={[styles.text, baseStyles.text]}>
          {t('update.currentVersion')}: {currentVersion}
        </Text>
      </View>

      {updateAvailable && (
        <View style={[topMenuBtns.btn, styles.container]}>
          <Text style={[styles.text, baseStyles.text]}>
            {t('update.latestVersion')}: {latestVersion}
          </Text>
          <TouchableOpacity onPress={openAppStore}>
            <Text style={[styles.download, baseStyles.text]}>
              {t('update.updateNow')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.divider} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
  },
  text: {
    fontSize: 12,
    marginVertical: 2,
  },
  download: {
    fontSize: 10,
    backgroundColor: 'blue',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  divider: {
    height: 10,
  },
});

export default VersionInfo;
