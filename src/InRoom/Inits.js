import { useEffect } from 'react';
import { useInitsStore } from '../zustand/inits';
import { useChatStore } from '../zustand/chat';

export const useInits = () => {
  const { initMQTT, initConfig, mqttReady, configReady } = useInitsStore();
  const { initRoom, initSupport }                        = useChatStore();
  useEffect(() => {
    initMQTT();
  }, []);

  useEffect(() => {
    if (!mqttReady) return;
    initConfig();
    initRoom();
  }, [mqttReady]);

  return mqttReady && configReady;
};

//export default Inits;
