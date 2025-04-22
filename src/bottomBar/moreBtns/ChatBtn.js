import * as React from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

import IconWithText from "../../settings/IconWithText";
import { baseStyles } from "../../constants";
import { useChatStore } from "../../zustand/chat";
import { modalModes } from "../../zustand/helper";

export const ChatBtn = () => {
  const { setChatMode, mode } = useChatStore();
  const { t } = useTranslation();

  const handlePress = () => {
    const _mode =
      mode === modalModes.close ? modalModes.chat : modalModes.close;
    setChatMode(_mode);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={baseStyles.listItem}>
      <IconWithText iconName="forum" text={t("bottomBar.chat")} />
    </TouchableOpacity>
  );
};
