import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import WIP from '../components/WIP';
import { getFromStorage } from '../shared/tools';
import { useDebugStore } from '../zustand/debug';

const DebugMode = () => {
  const { t } = useTranslation();
  const { debugMode, toggleDebugMode, wip, sendLogs } = useDebugStore();

  useEffect(() => {
    const initDebugMode = async () => {
      const debugMode = await getFromStorage('debugMode').then(value => {
        return value === 'true';
      });
      toggleDebugMode(debugMode);
    };
    initDebugMode();
  }, [toggleDebugMode]);

  if (Platform.OS !== 'android') {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('settings.debugMode')}</Text>
      <Switch
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={debugMode ? '#f5dd4b' : '#f4f3f4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleDebugMode}
        value={debugMode}
      />
      {debugMode && (
        <TouchableOpacity
          style={styles.button}
          onPress={sendLogs}
          disabled={wip}
        >
          <WIP isReady={!wip}>
            <Text style={styles.buttonText}>{t('settings.sendLogs')}</Text>
          </WIP>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 16,
    color: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default DebugMode;
