import Room from './Room';
import { useInitsStore } from '../zustand/inits';
import { useEffect } from 'react';
import WIP from '../components/WIP';

const PrepareRoom = () => {
  const { initMQTT, initConfig, mqttReady, configReady } = useInitsStore();

  useEffect(() => {
    if (!mqttReady) {
      initConfig().then(() => {
        initMQTT();
      });
    }
  }, [mqttReady]);

  return (
    <WIP isReady={mqttReady && configReady}>
      <Room />
    </WIP>
  );
};
export default PrepareRoom;