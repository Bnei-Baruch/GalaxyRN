import * as React from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

import IconWithText from "../../settings/IconWithText";
import { baseStyles } from "../../constants";
import { useChatStore } from "../../zustand/chat";
import { modalModes } from "../../zustand/helper";
import { ChatCounter } from "../../chat/ChatCounter";
import { ChatModal } from "../../chat/ChatModal";
export const ChatBtn = () => {
  const { setChatMode } = useChatStore();
  const { t } = useTranslation();

  const handlePress = () => {
    console.log("handlePress chat");
    setChatMode(modalModes.chat);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={baseStyles.listItem}>
      <IconWithText iconName="forum" text={t("bottomBar.chat")} />
      <ChatCounter />
      <ChatModal />
    </TouchableOpacity>
  );
};
