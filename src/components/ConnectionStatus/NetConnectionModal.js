import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  initConnectionMonitor,
  removeConnectionMonitor,
} from '../../libs/connection-monitor';
import logger from '../../services/logger';
import { useInitsStore } from '../../zustand/inits';
import { useUserStore } from '../../zustand/user';
import Text from '../CustomText';

const NAMESPACE = 'NetConnectionModal';

const NetConnectionModal = () => {
  const { t } = useTranslation();
  const { netIsOn } = useInitsStore();
  const hasUser = useUserStore(state => !!state.user);

  useEffect(() => {
    initConnectionMonitor();
    return () => {
      removeConnectionMonitor();
    };
  }, []);

  if (netIsOn || hasUser) {
    logger.debug(NAMESPACE, 'render null', netIsOn, hasUser);
    return null;
  }

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Icon name="warning" size={48} color="#ff6b6b" />
        </View>
        <Text style={styles.text}>{t('connection.noConnection')}</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
});

export default NetConnectionModal;
