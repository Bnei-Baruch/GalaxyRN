import React, { useEffect } from "react";
import { Dimensions } from "react-native";

import "intl-pluralrules";
import "react-native-url-polyfill";

import "../i18n/i18n";
import PrepareRoom from "../InRoom/PrepareRoom";
import useForegroundListener from "../InRoom/useForegroundListener";
import { SettingsNotJoined } from "../settings/SettingsNotJoined";
import useAudioDevicesStore from "../zustand/audioDevices";
import { useInitsStore } from "../zustand/inits";
import { useMyStreamStore } from "../zustand/myStream";
import { useShidurStore } from "../zustand/shidur";
import { useSubtitleStore } from "../zustand/subtitle";
import logger from "./logger";

const NAMESPACE = 'InitApp';

const InitApp = () => {
  const { myInit, myAbort } = useMyStreamStore();
  const { setIsPortrait, initApp, terminateApp } = useInitsStore();
  const { abortAudioDevices, initAudioDevices } = useAudioDevicesStore();
  const { init: initSubtitle, exit: exitSubtitle } = useSubtitleStore();
  const { audio } = useShidurStore();

  useEffect(() => {
    logger.info(NAMESPACE, "Initializing with language");
    initSubtitle(audio);
    return () => {
      logger.info(NAMESPACE, "Component unmounting, exiting");
      exitSubtitle(audio);
    };
  }, [audio]);

  const { readyForJoin } = useInitsStore();

  useForegroundListener();

  useEffect(() => {
    const { width, height } = Dimensions.get("window");
    setIsPortrait(height > width);

    initApp();
    initAudioDevices();
    myInit();

    return () => {
      terminateApp();
      abortAudioDevices();
      myAbort();
    };
  }, []);

  if (!readyForJoin) {
    return <SettingsNotJoined />;
  }

  return <PrepareRoom />;
};

export default InitApp;
