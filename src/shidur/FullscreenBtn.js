import * as React from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useSettingsStore } from "../zustand/settings";
import { topMenuBtns } from "../topBar/helper";

export const FullscreenBtn = () => {
  const { isFullscreen, toggleIsFullscreen } = useSettingsStore();

  return (
    <Icon
      name={!isFullscreen ? "fullscreen" : "fullscreen-exit"}
      size={30}
      color="white"
      onPress={toggleIsFullscreen}
      style={topMenuBtns.btn}
    />
  );
};
