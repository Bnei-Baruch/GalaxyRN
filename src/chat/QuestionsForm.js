import {
  StyleSheet,
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
import { TouchableOpacity, Text } from "react-native";

export const QuestionsForm = () => {
  const [value, setValue] = useState("");
  const { t } = useTranslation();

  const { room } = useRoomStore();
  const {
    user: { id, display },
  } = useUserStore();
  const { sendQuestion } = useChatStore();

  if (!room?.room) return null;

  const newChatMessage = async () => {
    await sendQuestion({
      serialUserId: id,
      question: { content: value },
      user: {
        id,
        name: display,
        galaxyRoom: room.description,
        gender: !room.description.match(/^W\s/) ? "male" : "female",
      },
    });
    setValue("");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "position" : null}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={t("chat.myName")}
          value={display}
          style={styles.input}
          editable={false}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={t("chat.room")}
          value={room.description}
          style={styles.input}
          editable={false}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={t("chat.newMsg")}
          value={value}
          onChangeText={setValue}
          style={styles.input}
        />
      </View>
      <TouchableOpacity
        onPress={newChatMessage}
        style={[styles.button, !value.trim() && styles.buttonDisabled]}
        disabled={!value.trim()}
      >
        <Text style={styles.buttonText}>{t("chat.send")}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginVertical: 8,
    width: "100%",
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "grey",
    padding: 10,
    height: 44,
    color: "white",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  button: {
    borderRadius: 8,
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0,
    backgroundColor: "#4A6FFF",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: "#444",
  },
});
