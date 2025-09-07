import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';

import 'intl-pluralrules';
import 'react-native-url-polyfill';

import Room from '../InRoom/Room';
import WIP from '../components/WIP';
import '../i18n/i18n';

import useForegroundListener from '../InRoom/useForegroundListener';
import useScreenRotationListener from '../InRoom/useScreenRotationListener';
import {
  initConnectionMonitor,
  removeConnectionMonitor,
} from '../libs/connection-monitor';
import { SettingsNotJoined } from '../settings/SettingsNotJoined';

import useAudioDevicesStore from '../zustand/audioDevices';
import { useInitsStore } from '../zustand/inits';
import { useMyStreamStore } from '../zustand/myStream';
import { useShidurStore } from '../zustand/shidur';
import { useSubtitleStore } from '../zustand/subtitle';

const InitApp = () => {
  const { myInit, myAbort } = useMyStreamStore();
  const {
    setIsPortrait,
    initApp,
    terminateApp,
    initMQTT,
    abortMqtt,
    initConfig,
  } = useInitsStore();
  const { abortAudioDevices, initAudioDevices } = useAudioDevicesStore();
  const { init: initSubtitle, exit: exitSubtitle } = useSubtitleStore();
  const { mqttReady, configReady } = useInitsStore();
  const {
    audio: { key },
  } = useShidurStore();
  const { readyForJoin } = useInitsStore();

  useEffect(() => {
    if (key) {
      initSubtitle();
    }
    return () => {
      exitSubtitle();
    };
  }, [key]);

  useForegroundListener();
  useScreenRotationListener();

  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    setIsPortrait(height > width);

    initApp();
    initAudioDevices();
    myInit();
    initConfig();
    initMQTT();
    initConnectionMonitor();

    return () => {
      terminateApp();
      abortAudioDevices();
      myAbort();
      abortMqtt();
      removeConnectionMonitor();
    };
  }, []);

  if (!readyForJoin) {
    return <SettingsNotJoined />;
  }

  return (
    <WIP isReady={mqttReady && configReady}>
      <Room />
    </WIP>
  );
};

export default InitApp;
