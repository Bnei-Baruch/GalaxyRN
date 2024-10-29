import Room from './Room';
import { Text } from 'react-native';
import { useInitsStore } from '../zustand/inits';
import { useEffect } from 'react';

const PrepareRoom = () => {
  const { initMQTT, initConfig, mqttReady, configReady } = useInitsStore();

  useEffect(() => {
    if (!mqttReady) {
      initConfig().then(() => {
        initMQTT();
      });
    }
  }, [mqttReady]);

  return mqttReady && configReady ? <Room /> : <Text>preparing of room</Text>;
};
export default PrepareRoom;