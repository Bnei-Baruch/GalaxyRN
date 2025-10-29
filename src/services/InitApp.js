import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';

import 'intl-pluralrules';
import 'react-native-url-polyfill';

import Room from '../InRoom/Room';
import '../i18n/i18n';

import useScreenRotationListener from '../InRoom/useScreenRotationListener';
import {
  initConnectionMonitor,
  removeConnectionMonitor,
} from '../libs/connection-monitor';
import { SettingsNotJoined } from '../settings/SettingsNotJoined';

import useAudioDevicesStore from '../zustand/audioDevices';
import { useInRoomStore } from '../zustand/inRoom';
import { useInitsStore } from '../zustand/inits';
import { useMyStreamStore } from '../zustand/myStream';
import { useVersionStore } from '../zustand/version';
import RequiredUpdate from './RequiredUpdate';
import logger from './logger';

const NAMESPACE = 'InitApp';

const InitApp = () => {
  const { myInit, myAbort } = useMyStreamStore();
  const { forceUpdate } = useVersionStore();
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
  const { isInRoom } = useInRoomStore();

  useScreenRotationListener();

  useEffect(() => {
    logger.debug(NAMESPACE, 'isAppInited useEffect', isAppInited);
    const init = async () => {
      logger.debug(NAMESPACE, 'init');
      if (isAppInited) return;
      setIsAppInited(true);

      const { width, height } = Dimensions.get('window');
      setIsPortrait(height > width);
      try {
        logger.debug(NAMESPACE, 'initConnectionMonitor');
        initConnectionMonitor();
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
      removeConnectionMonitor();
    };
  }, [isAppInited]);

  if (forceUpdate) {
    return <RequiredUpdate />;
  }

  if (!isInRoom) {
    return <SettingsNotJoined />;
  }

  return <Room />;
};

export default InitApp;
