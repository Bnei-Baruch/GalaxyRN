import React from 'react';
import { Modal } from 'react-native';
import mqtt from '../../libs/mqtt';
import logger from '../../services/logger';
import { AppInitStates, useInitsStore } from '../../zustand/inits';
import { useSettingsStore } from '../../zustand/settings';
import WIP from '../WIP';
import ConnectionNotStable from './ConnectionNotStable';

const NAMESPACE = 'MqttConnectionModal';

const MqttConnectionModal = () => {
  const { mqttIsOn } = useInitsStore();
  const netWIP = useSettingsStore(state => state.netWIP);
  const appInitState = useInitsStore(state => state.appInitState);

  logger.debug(NAMESPACE, 'render', mqttIsOn, netWIP, mqtt.mq?.connected);

  if (netWIP) {
    return <ConnectionNotStable />;
  }

  if (mqttIsOn) {
    return null;
  }

  if (AppInitStates.READY !== appInitState || !mqtt.wasConnected) {
    return (
      <Modal visible={true} animationType="fade" transparent={false}>
        <WIP isReady={false} />
      </Modal>
    );
  }

  return null;
};

export default MqttConnectionModal;
