import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';

import 'intl-pluralrules';
import 'react-native-url-polyfill';

import '../i18n/i18n';

import PrepareRoom from '../InRoom/PrepareRoom';
import useForegroundListener from '../InRoom/useForegroundListener';
import useScreenRotationListener from '../InRoom/useScreenRotationListener';
import { SettingsNotJoined } from '../settings/SettingsNotJoined';

import useAudioDevicesStore from '../zustand/audioDevices';
import { useInitsStore } from '../zustand/inits';
import { useMyStreamStore } from '../zustand/myStream';
import { useShidurStore } from '../zustand/shidur';
import { useSubtitleStore } from '../zustand/subtitle';

const InitApp = () => {
  const { myInit, myAbort } = useMyStreamStore();
  const { setIsPortrait, initApp, terminateApp } = useInitsStore();
  const { abortAudioDevices, initAudioDevices } = useAudioDevicesStore();
  const { init: initSubtitle, exit: exitSubtitle } = useSubtitleStore();
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
    //initAudioDevices();
    myInit();

    return () => {
      terminateApp();
      //abortAudioDevices();
      myAbort();
    };
  }, []);

  if (!readyForJoin) {
    return <SettingsNotJoined />;
  }

  return <PrepareRoom />;
};

export default InitApp;
