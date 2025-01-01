import Room from './Room';
import { useInitsStore } from '../zustand/inits';
import { useEffect } from 'react';
import WIP from '../components/WIP';
import useForegroundListener from './useForegroundListener';

const PrepareRoom = () => {
  const { initMQTT, initConfig, mqttReady, configReady, initPermissions } = useInitsStore();
  useForegroundListener();

  useEffect(() => {
    const inits = async () => {
      if (mqttReady)
        return;
      if (!await initPermissions())
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