import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import { useAndroidPermissionsStore } from '../zustand/androidPermissions';
import logger from './logger';

const isAndroid = Platform.OS === 'android';

const NAMESPACE = 'AndroidPermissions';

const PERMISSION_LABEL_KEYS = {
  'android.permission.CAMERA': 'androidPermissions.camera',
  'android.permission.RECORD_AUDIO': 'androidPermissions.microphone',
  'android.permission.BLUETOOTH_CONNECT': 'androidPermissions.bluetooth',
  'android.permission.POST_NOTIFICATIONS': 'androidPermissions.notifications',
  'android.permission.READ_PHONE_STATE': 'androidPermissions.phoneState',
};

const PermissionsGate = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const permissionStatuses = useAndroidPermissionsStore(
    state => state.permissionStatuses
  );

  return (
    <View
      style={[styles.container, { paddingTop: insets.top || 24 }]}
    >
      <Text style={styles.title}>{t('androidPermissions.title')}</Text>
      <Text style={styles.text}>{t('androidPermissions.message')}</Text>
      <View style={styles.list}>
        {Object.entries(permissionStatuses).map(([permission, granted]) => (
          <View key={permission} style={styles.row}>
            <Text style={styles.rowText}>
              {t(PERMISSION_LABEL_KEYS[permission] || permission)}
            </Text>
            <Text
              style={[
                styles.status,
                granted ? styles.statusGranted : styles.statusPending,
              ]}
            >
              {granted
                ? t('androidPermissions.granted')
                : t('androidPermissions.pending')}
            </Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => Linking.openSettings()}
      >
        <Text style={styles.settingsText}>
          {t('androidPermissions.openSettings')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const AndroidPermissions = ({ children }) => {
  const permReady = useAndroidPermissionsStore(state => state.permReady);

  useEffect(() => {
    if (!isAndroid) {
      return;
    }

    const { initPermissions, terminatePermissions } =
      useAndroidPermissionsStore.getState();
    initPermissions();

    return () => {
      terminatePermissions();
    };
  }, []);

  if (isAndroid && !permReady) {
    logger.debug(NAMESPACE, 'Permissions not ready, showing permissions screen');
    return <PermissionsGate />;
  }

  return <View style={baseStyles.full}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'black',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
  },
  text: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
  },
  list: {
    width: '100%',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#444',
  },
  rowText: {
    color: '#fff',
    fontSize: 15,
  },
  status: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statusGranted: {
    color: '#2ecc71',
  },
  statusPending: {
    color: '#e67e22',
  },
  settingsBtn: {
    backgroundColor: '#4b7bec',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  settingsText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AndroidPermissions;
