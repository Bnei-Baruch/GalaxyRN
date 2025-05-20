import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useSubtitleStore } from "../zustand/subtitle";
import { topMenuBtns } from "../topBar/helper";
import { useUserStore } from "../zustand/user";

export const SubtitleBtn = () => {
  const { toggleIsOpen, lastMsg, isOpen, init, exit } = useSubtitleStore();
  const { language } = useUserStore();

  useEffect(() => {
    init();
    return () => exit();
  }, [language]);

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
