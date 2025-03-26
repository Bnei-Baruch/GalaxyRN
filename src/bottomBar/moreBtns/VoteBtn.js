import * as React from "react";
import { useState } from "react";
import { TouchableOpacity, Modal, View, StyleSheet } from "react-native";
import IconWithText from "../../settings/IconWithText";
import { useUserStore } from "../../zustand/user";
import { useTranslation } from "react-i18next";
import { WebView } from "react-native-webview";
import { baseStyles } from "../../constants";
import { useInitsStore } from "../../zustand/inits";
import Icon from "react-native-vector-icons/MaterialIcons";

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
          <View style={styles.modal}>
            <View style={styles.conteiner}>
              <TouchableOpacity style={styles.close} onPress={toggleOpen}>
                <Icon name="close" size={20} color="white" />
              </TouchableOpacity>
              <WebView
                style={styles.item}
                source={{
                  uri: `https://vote.kli.one/button.html?answerId=1&userId=${user?.id}`,
                }}
              />
              <WebView
                style={styles.item}
                source={{
                  uri: `https://vote.kli.one/button.html?answerId=2&userId=${user?.id}`,
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};
const styles = StyleSheet.create({
  modal: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  conteiner: {
    width: 200,
    height: 100,
    flexDirection: "row",
  },
  item: {
    width: 100,
    height: 100,
  },
  close: {
    position: "absolute",
    top: -25,
    right: -25,
    zIndex: 1,
  },
});
