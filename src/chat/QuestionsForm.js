import {
  StyleSheet,
  Button,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import useRoomStore from "../zustand/fetchRooms";
import { useUserStore } from "../zustand/user";
import { useTranslation } from "react-i18next";
import { useChatStore } from "../zustand/chat";

export const QuestionsForm = () => {
  const [value, setValue] = useState("");
  const { t } = useTranslation();

  const { room } = useRoomStore();
  const {
    user: { id, display },
  } = useUserStore();
  const { sendQuestion } = useChatStore();

  if (!room?.room) return null;

  const newChatMessage = () => {
    sendQuestion({
      serialUserId: id,
      question: { content: value },
      user: {
        id,
        name: display,
        galaxyRoom: room.description,
        gender: !room.description.match(/^W\s/) ? "male" : "female",
      },
    });
  };

  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={45}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View>
        <TextInput
          type="text"
          placeholder={t("chat.myName")}
          value={display}
          style={styles.input}
        />
      </View>
      <View>
        <TextInput
          type="text"
          placeholder={t("chat.room")}
          value={room.description}
          readOnly={true}
          style={styles.input}
        />
      </View>
      <View>
        <TextInput
          type="text"
          placeholder={t("chat.newMsg")}
          value={value}
          onChangeText={setValue}
          style={styles.input}
        />
      </View>
      <Button
        size={30}
        positive
        onPress={newChatMessage}
        title={t("chat.send")}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  input: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "grey",
    margin: 5,
    color: "white",
  },
  containerRtl: {
    direction: "rtl",
    textAlign: "right",
  },
  containerLtr: {
    direction: "ltr",
    textAlign: "left",
  },
  time: {
    color: "grey",
  },
});
