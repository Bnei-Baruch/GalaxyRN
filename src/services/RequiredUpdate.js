import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useVersionStore } from '../zustand/version';

const RequiredUpdate = () => {
  const { openAppStore, currentVersion, latestVersion, updateAvailable } =
    useVersionStore();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('update.isRequired')}</Text>

        <Text style={styles.message}>{t('update.pleaseUpdate')}</Text>

        <Text style={styles.versionInfo}>
          {t('update.currentVersion')}: {currentVersion}
        </Text>
        {updateAvailable && (
          <Text style={styles.versionInfo}>
            {t('update.latestVersion')}: {latestVersion}
          </Text>
        )}

        <TouchableOpacity style={styles.updateButton} onPress={openAppStore}>
          <Text style={styles.updateButtonText}>{t('update.updateNow')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  versionInfo: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 5,
  },
  updateButton: {
    backgroundColor: 'blue',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 20,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RequiredUpdate;
