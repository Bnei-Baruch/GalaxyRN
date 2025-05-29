import React from "react";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useSubtitleStore } from "../zustand/subtitle";
import { topMenuBtns } from "../topBar/helper";

export const SubtitleBtn = () => {
  const { toggleIsOpen, lastMsg, isOpen } = useSubtitleStore();

  const toggle = () => toggleIsOpen();

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
