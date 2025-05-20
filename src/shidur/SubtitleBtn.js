import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useSubtitleStore } from "../zustand/subtitle";
import { topMenuBtns } from "../topBar/helper";
import { useShidurStore } from "../zustand/shidur";

export const SubtitleBtn = () => {
  const { toggleIsOpen, lastMsg, isOpen, init, exit } = useSubtitleStore();
  const { audio } = useShidurStore();

  useEffect(() => {
    console.log("[SubtitleBtn] Initializing with language");
    init();
    return () => {
      console.log("[SubtitleBtn] Component unmounting, exiting");
      exit();
    };
  }, [audio]);

  const toggle = () => {
    console.log(
      "[SubtitleBtn] Toggling subtitle visibility. Current state:",
      isOpen
    );
    toggleIsOpen();
  };

  return (
    <TouchableOpacity
      disabled={!lastMsg}
      onPress={toggle}
      style={[topMenuBtns.btn, topMenuBtns.firstBtn]}
    >
      <Icon
        name={isOpen ? "subtitles-off" : "subtitles"}
        size={30}
        color={!lastMsg ? "gray" : "white"}
      />
    </TouchableOpacity>
  );
};
