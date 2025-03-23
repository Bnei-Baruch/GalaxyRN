import * as React from "react";
import { TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { topMenuBtns } from "./helper";

import { useChatStore } from "../zustand/chat";
import { modalModes } from "../zustand/helper";

export const ChatBtn = () => {
  const { setChatMode, mode } = useChatStore();

  const handlePress = () => {
    const _mode =
      mode === modalModes.close ? modalModes.chat : modalModes.close;
    setChatMode(_mode);
  };

  return (
    <View></View>
    /*<TouchableOpacity onPress={handlePress} style={topMenuBtns.btn}>
      <Icon name="forum" size={30} color="white" />
    </TouchableOpacity>*/
  );
};
