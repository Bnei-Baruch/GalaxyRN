import { useEffect } from 'react';

import WIP from '../components/WIP';
import logger from '../services/logger';
import { useInitsStore } from '../zustand/inits';
import Room from './Room';

const NAMESPACE = 'PrepareRoom';

const PrepareRoom = () => {
  const { initMQTT, initConfig, mqttReady, configReady, abortMqtt } =
    useInitsStore();

  useEffect(() => {
    const inits = async () => {
      if (mqttReady) return;
      try {
        await initConfig();
        await initMQTT();
      } catch (error) {
        logger.error(NAMESPACE, 'Error during initialization:', error);
      }
    };

    inits();
  }, [mqttReady]);

  return (
    <WIP isReady={mqttReady && configReady}>
      <Room />
    </WIP>
  );
};
export default PrepareRoom;
