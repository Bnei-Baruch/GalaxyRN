import React, { useEffect } from "react";
import { Dimensions } from "react-native";

import "react-native-url-polyfill";
import "intl-pluralrules";

import "../i18n/i18n";
import PrepareRoom from "../InRoom/PrepareRoom";
import useForegroundListener from "../InRoom/useForegroundListener";
import { setTag, addBreadcrumb } from "../libs/sentry/sentryHelper";
import { SettingsNotJoined } from "../settings/SettingsNotJoined";
import useAudioDevicesStore from "../zustand/audioDevices";
import { useInitsStore } from "../zustand/inits";
import { useMyStreamStore } from "../zustand/myStream";
import { useSubtitleStore } from "../zustand/subtitle";

const InitApp = () => {
  const { myInit, myAbort } = useMyStreamStore();
  const { setIsPortrait, initApp, terminateApp } = useInitsStore();
  const { abortAudioDevices, initAudioDevices } = useAudioDevicesStore();
  const { init: initSubtitle, exit: exitSubtitle } = useSubtitleStore();
  const { audio } = useShidurStore();

  useEffect(() => {
    console.log("[SubtitleBtn] Initializing with language");
    initSubtitle(audio);
    return () => {
      console.log("[SubtitleBtn] Component unmounting, exiting");
      exitSubtitle(audio);
    };
  }, [audio]);

  const { readyForJoin } = useInitsStore();

  useForegroundListener();

  useEffect(() => {
    const init = async () => {
      try {
        addBreadcrumb("initialization", "Starting app initialization");

        setTag("app_version", require("../../package.json").version);
        setTag("platform", "react-native");

        await myInit();
        addBreadcrumb("initialization", "myInit completed");

        await initApp();
        addBreadcrumb("initialization", "initApp completed");

        initAudioDevices();
        addBreadcrumb("initialization", "Audio devices initialized");

        initSubtitle();
        addBreadcrumb("initialization", "Subtitle initialized");
      } catch (error) {
        console.error("Error during initialization:", error);
        throw error;
      }
    };

    init();

    return () => {
      myAbort();
      terminateApp();
      abortAudioDevices();
    };
  }, []);

  useEffect(() => {
    const onChange = () => {
      const dim = Dimensions.get("screen");
      const _isPortrait = dim.height >= dim.width;
      setIsPortrait(_isPortrait);
    };
    let subscription = Dimensions.addEventListener("change", onChange);
    onChange();

    return () => subscription && subscription.remove();
  }, []);

  return readyForJoin ? <PrepareRoom /> : <SettingsNotJoined />;
};

export default InitApp;
