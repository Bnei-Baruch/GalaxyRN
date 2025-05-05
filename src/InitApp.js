import { useEffect } from "react";
import "react-native-url-polyfill";
import "intl-pluralrules";
import "./i18n/i18n";
import { useMyStreamStore } from "./zustand/myStream";
import { useInitsStore } from "./zustand/inits";
import { Dimensions } from "react-native";
import useForegroundListener from "./InRoom/useForegroundListener";
import useAudioDevicesStore from "./zustand/audioDevices";
import { useSettingsStore } from "./zustand/settings";

const InitApp = () => {
  const { myInit, myAbort } = useMyStreamStore();
  const { setIsPortrait, initApp, terminateApp } = useInitsStore();
  const { initAudioDevices, abortAudioDevices } = useAudioDevicesStore();
  const { cleanup } = useSettingsStore();

  useForegroundListener();

  useEffect(() => {
    const init = async () => {
      await myInit();
      await initApp();
      initAudioDevices();
    };
    init();
    return () => {
      myAbort();
      terminateApp();
      abortAudioDevices();
      cleanup();
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

  return null;
};

export default InitApp;
