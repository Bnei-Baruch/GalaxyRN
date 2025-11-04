import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { baseStyles } from '../../constants';
import logger from '../../services/logger';
import { useSettingsStore } from '../../zustand/settings';
import Text from '../CustomText';

const NAMESPACE = 'ConnectionNotStable';

const ConnectionNotStable = () => {
  const { t } = useTranslation();
  const netWIP = useSettingsStore(state => state.netWIP);

  logger.debug(NAMESPACE, 'render', netWIP);

  if (!netWIP) return null;

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={baseStyles.full}>
        <View style={styles.container}>
          <ActivityIndicator
            size="large"
            color="#3a2f00"
            style={styles.spinner}
          />
          <Text style={styles.text}>{t('connection.unstable')}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFEB99',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#3a2f00',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default ConnectionNotStable;
