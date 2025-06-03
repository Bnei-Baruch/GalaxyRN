import * as React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { debug } from '../../services/logger';

import IconWithText from "../../settings/IconWithText";
import { baseStyles } from "../../constants";
import { useChatStore } from "../../zustand/chat";
import { modalModes } from "../../zustand/helper";
import { ChatCounter } from "../../chat/ChatCounter";

const NAMESPACE = 'ChatBtn';

export const ChatBtn = () => {
  const { setChatMode } = useChatStore();
  const { t } = useTranslation();

  const handlePress = () => {
    debug(NAMESPACE, "handlePress chat");
    setChatMode(modalModes.chat);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[baseStyles.listItem, styles.container]}
    >
      <View style={styles.leftBlock}>
        <ChatCounter />
        <IconWithText iconName="forum" text={t("bottomBar.chat")} />
      </View>
      <View style={styles.divider}></View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  divider: {
    flex: 1,
  },
  container: {
    flexDirection: "row",
  },
  leftBlock: {
    paddingRight: 15,
  },
});
