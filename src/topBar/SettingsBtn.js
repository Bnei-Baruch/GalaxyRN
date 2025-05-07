import * as React from "react";
import { useState } from "react";
import { TouchableOpacity, Text, Modal, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { topMenuBtns } from "./helper";
import { SettingsJoined } from "../settings/SettingsJoined";
import { useTranslation } from "react-i18next";

export const SettingsBtn = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  const toggleVisible = () => setVisible(!visible);

  return (
    <>
      <TouchableOpacity onPress={toggleVisible} style={topMenuBtns.btn}>
        <Icon name="settings" size={30} color="white" />
        <Text style={topMenuBtns.menuItemText}>{t("topBar.settings")}</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        style={styles.bg}
        visible={visible}
        onRequestClose={toggleVisible}
      >
        <SettingsJoined toggleVisible={toggleVisible} />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bg: {
    backgroundColor: "black",
  },
});
