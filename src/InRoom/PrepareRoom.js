import Room from './Room';
import { useInitsStore } from '../zustand/inits';
import { useEffect } from 'react';
import WIP from '../components/WIP';

const PrepareRoom = () => {
  const { initMQTT, initConfig, mqttReady, configReady } = useInitsStore();

  useEffect(() => {
    const inits = async () => {
      if (mqttReady)
        return;
      await initConfig();
      await initMQTT();
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