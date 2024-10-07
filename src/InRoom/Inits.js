import { useEffect } from 'react';
import { useInitsStore } from '../zustand/inits';
import { useChatStore } from '../zustand/chat';
import { useInRoomStore } from '../zustand/in_room';

export const useInits = () => {
  const { initMQTT, initConfig, mqttReady, configReady } = useInitsStore();
  const { initRoom, initSupport }                        = useChatStore();
  const { exitRoom }                                     = useInRoomStore();

  useEffect(() => {
    initMQTT();
    return () => {
      exitRoom();
    };
  }, []);

  useEffect(() => {
    if (!mqttReady) return;
    initConfig();
    initRoom();
  }, [mqttReady]);

  return mqttReady && configReady;
};

//export default Inits;
