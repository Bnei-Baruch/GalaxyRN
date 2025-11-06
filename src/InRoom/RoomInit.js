import { useEffect } from 'react';
import { Dimensions } from 'react-native';

import logger from '../services/logger';
import useAudioDevicesStore from '../zustand/audioDevices';
import { useInitsStore } from '../zustand/inits';
import { useMyStreamStore } from '../zustand/myStream';

const NAMESPACE = 'RoomInit';

const RoomInit = () => {
  const { myInit, myAbort } = useMyStreamStore();

  logger.debug(NAMESPACE, 'render');

  const {
    setIsPortrait,
    initApp,
    terminateApp,
    initMQTT,
    abortMqtt,
    initConfig,
    setIsAppInited,
    isAppInited,
  } = useInitsStore();
  const { abortAudioDevices, initAudioDevices } = useAudioDevicesStore();

  useEffect(() => {
    logger.debug(NAMESPACE, 'isAppInited useEffect', isAppInited);
    const init = async () => {
      logger.debug(NAMESPACE, 'init', isAppInited);
      if (isAppInited) return;
      setIsAppInited(true);

      const { width, height } = Dimensions.get('window');
      setIsPortrait(height > width);
      try {
        logger.debug(NAMESPACE, 'initApp');
        await initApp();
        logger.debug(NAMESPACE, 'initAudioDevices');
        await initAudioDevices();
        logger.debug(NAMESPACE, 'myInit');
        await myInit();
        logger.debug(NAMESPACE, 'initConfig');
        await initConfig();
        logger.debug(NAMESPACE, 'initMQTT');
        await initMQTT();
        logger.debug(NAMESPACE, 'init done');
      } catch (error) {
        setIsAppInited(false);
        logger.error(NAMESPACE, 'Error initializing app', error);
      }
    };
    init();

    return () => {
      logger.debug(NAMESPACE, 'terminateApp', isAppInited);
      if (!isAppInited) return;

      setIsAppInited(false);
      terminateApp();
      abortAudioDevices();
      myAbort();
      abortMqtt();
    };
  }, [isAppInited]);
  return null;
};

export default RoomInit;
