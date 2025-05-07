import { useEffect } from "react";
import { StyleSheet, View, ScrollView } from "react-native";

import { useChatStore } from "../zustand/chat";
import { Message } from "./Message";
import { RoomChatForm } from "./RoomChatForm";


export const RoomChat = () => {
  const { roomMsgs, resetChatNewMsgs } = useChatStore();

  useEffect(() => {
    resetChatNewMsgs();
  }, [roomMsgs]);

  return (
    <View style={[styles.container]}>
      <View style={styles.messagesContainer}>
        <ScrollView style={styles.scroll}>
          {roomMsgs.map((m) => (
            <Message key={m.time} msg={m} />
          ))}
        </ScrollView>
      </View>
      <RoomChatForm />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    flexDirection: "column",
  },
  scroll: {
    width: "100%",
  },
  formContainer: {
    marginTop: 10,
  },
});
