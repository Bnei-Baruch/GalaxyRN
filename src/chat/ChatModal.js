import { useEffect } from "react";
import { View, Modal, Text, StyleSheet, TouchableOpacity } from "react-native";
import { modalModes } from "../zustand/helper";
import { useTranslation } from "react-i18next";

import { useChatStore } from "../zustand/chat";
import { RoomChat } from "./RoomChat";
import ScreenTitle from "../components/ScreenTitle";
import { Questions } from "./Questions";
import { useCrispStore } from "../zustand/crisp";
import { ChatCounter } from "./ChatCounter";


export const ChatModal = () => {
  const { mode, setChatMode, cleanChat, chatNewMsgs} = useChatStore();
  const { start: openSupport } = useCrispStore();
  const { t } = useTranslation();

  useEffect(() => {
    return () => {
      cleanChat();
    };
  }, []);

  console.log("ChatModal render mode ", mode);

  if (mode === modalModes.close) {
    return null;
  }

  const closeModal = () => setChatMode(modalModes.close);

  return (
    <Modal>
      <View style={styles.modalContainer}>
        <ScreenTitle text={t("topBar.communicationTitle")} close={closeModal} />
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tabContainer,
              mode === modalModes.chat && styles.selectedTab,
            ]}
            onPress={() => setChatMode(modalModes.chat)}
          >
            <Text style={styles.tabText}>{t("chat.tab.chat")}</Text>
            <ChatCounter />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabContainer]} onPress={openSupport}>
            <Text style={styles.tabText}>{t("chat.tab.support")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabContainer,
              mode === modalModes.question && styles.selectedTab,
            ]}
            onPress={() => setChatMode(modalModes.question)}
          >
            <Text style={styles.tabText}>{t("chat.tab.question")}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          {mode === modalModes.chat && <RoomChat />}
          {mode === modalModes.question && <Questions />}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    width: "100%",
  },
  tabContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "white",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTab: {
    borderBottomWidth: 5,
  },
  tabText: {
    color: "white",
    fontSize: 16,
  },
  newMsgs: {
    color: "red",
    fontSize: 16,
  },
});
