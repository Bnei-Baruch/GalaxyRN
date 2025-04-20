import { useEffect } from "react";
import { View, Modal, Text, StyleSheet, TouchableOpacity } from "react-native";
import { modalModes } from "../zustand/helper";
import { useTranslation } from "react-i18next";

import { useChatStore } from "../zustand/chat";
import { RoomChat } from "./RoomChat";
import ScreenTitle from "../components/ScreenTitle";
import { Questions } from "./Questions";
import SupportChat from "./SupportChat";

export const ChatModal = () => {
  const { mode, setChatMode, cleanChat } = useChatStore();
  const { t } = useTranslation();

  useEffect(() => {
    return () => {
      cleanChat();
    };
  }, []);

  const selectTab = (m) => setChatMode(m);
  const closeModal = () => setChatMode(modalModes.close);

  return (
    <Modal visible={mode !== modalModes.close}>
      <View style={styles.modalContainer}>
        <ScreenTitle text={t("topBar.communicationTitle")} close={closeModal} />
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[
              styles.tabContainer, 
              mode === modalModes.chat && styles.selectedTab
            ]}
            onPress={() => selectTab(modalModes.chat)}
          >
            <Text style={styles.tabText}>
              {t("chat.tab.chat")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tabContainer, 
              mode === modalModes.support && styles.selectedTab
            ]}
            onPress={() => selectTab(modalModes.support)}
          >
            <Text style={styles.tabText}>
              {t("chat.tab.support")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tabContainer, 
              mode === modalModes.question && styles.selectedTab
            ]}
            onPress={() => selectTab(modalModes.question)}
          >
            <Text style={styles.tabText}>
              {t("chat.tab.question")}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}  >
          {mode === modalModes.chat && <RoomChat />}
          {mode === modalModes.support && <SupportChat />}
          {mode === modalModes.question && <Questions />}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    width: '100%',
  },
  tabContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    borderBottomWidth: 5,
  },
  tabText: {
    color: 'white',
    fontSize: 16,
  }
});
