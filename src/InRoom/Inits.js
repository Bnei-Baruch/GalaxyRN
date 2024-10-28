import { useEffect } from 'react';
import { useInitsStore } from '../zustand/inits';
import { useChatStore } from '../zustand/chat';

export const useInits = () => {
  const { initMQTT, initConfig, mqttReady, configReady } = useInitsStore();
  const { initRoom, initSupport }                        = useChatStore();

  useEffect(() => {
    initConfig().then(() => {
      initMQTT();
    });
  }, []);

  useEffect(() => {
    if (mqttReady) {
      initRoom();
    }
  }, [mqttReady]);

  return mqttReady && configReady;
};

//export default Inits;
