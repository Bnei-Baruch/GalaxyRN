import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSettingsStore } from '../zustand/settings';

const ConnectionNotStable = () => {
  const { t } = useTranslation();

  const { netWIP } = useSettingsStore();

  if (!netWIP) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#3a2f00"
          style={styles.spinner}
        />
        <Text style={styles.text}>{t('connection.unstable')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    width: '100%',
    backgroundColor: '#FFEB99',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    color: '#3a2f00',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default ConnectionNotStable;
