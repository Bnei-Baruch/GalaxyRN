import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import logger from '../../services/logger';
import mqtt from '../../shared/mqtt';
import { useInitsStore } from '../../zustand/inits';
import { useSettingsStore } from '../../zustand/settings';
import Text from '../CustomText';
import WIP from '../WIP';
import ConnectionNotStable from './ConnectionNotStable';

const NAMESPACE = 'MqttConnectionModal';

const MqttConnectionModal = () => {
  const { t } = useTranslation();
  const { mqttIsOn, abortMqtt, initMQTT } = useInitsStore();
  const netWIP = useSettingsStore(state => state.netWIP);

  logger.debug(NAMESPACE, 'render', mqttIsOn, netWIP);

  if (netWIP) {
    return <ConnectionNotStable />;
  }

  if (mqttIsOn) {
    return null;
  }

  if (!mqtt.initialized) {
    return (
      <Modal
        visible={true}
        animationType="fade"
        transparent={false}
        statusBarTranslucent={true}
      >
        <WIP isReady={false} />
      </Modal>
    );
  }

  const handleRestartMqtt = async () => {
    await abortMqtt();
    await initMQTT();
  };

  return (
    <Modal
      visible={true}
      animationType="fade"
      transparent={false}
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.iconContainer}>
          <Icon name="warning" size={48} color="#ff6b6b" />
        </View>
        <Text style={styles.text}>{t('connection.noConnection')}</Text>

        <TouchableOpacity style={styles.button} onPress={handleRestartMqtt}>
          <ConnectionNotStable />
          <Text style={styles.buttonText}>{t('settings.tryConnect')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  button: {
    borderRadius: 5,
    backgroundColor: '#03A9F4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 150,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default MqttConnectionModal;
