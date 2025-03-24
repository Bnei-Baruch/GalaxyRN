import * as React from "react";
import { useState } from "react";
import { TouchableOpacity, Modal, View, StyleSheet } from "react-native";
import IconWithText from "../../settings/IconWithText";
import { useUserStore } from "../../zustand/user";
import { useTranslation } from "react-i18next";
import { WebView } from "react-native-webview";
import { baseStyles } from "../../constants";

export const VoteBtn = () => {
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();
  const { user } = useUserStore();

  const toggleOpen = () => setOpen(!open);

  return (
    <>
      <TouchableOpacity onPress={toggleOpen} style={baseStyles.listItem}>
        <IconWithText iconName="thumbs-up-down" text={t("bottomBar.vote")} />
      </TouchableOpacity>
      {open && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={open}
          onRequestClose={toggleOpen}
        >
          <View style={styles.modalContent}>
            <WebView
              source={{
                uri: `https://vote.kli.one/button.html?answerId=1&userId=${user?.id}`,
              }}
            />
            <WebView
              source={{
                uri: `https://vote.kli.one/button.html?answerId=2&userId=${user?.id}`,
              }}
            />
          </View>
        </Modal>
      )}
    </>
  );
};
const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    aspectRatio: 3 / 5,
    width: "100%",
    height: 100,
  },
});
