import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { useState, useRef } from "react";
import useRoomStore from "../zustand/fetchRooms";
import { useUserStore } from "../zustand/user";
import mqtt from "../shared/mqtt";
import { useTranslation } from "react-i18next";

export const RoomChatForm = () => {
  const [value, setValue] = useState("");
  const { t } = useTranslation();
  const inputRef = useRef(null);

  const { room } = useRoomStore();
  const { user } = useUserStore();

  if (!room?.room) return null;

  // This function will send the message without dismissing the keyboard
  const forceSubmit = () => {
    if (!value.trim()) return;

    const { id, display, role } = user;

    const msg = {
      user: { id, role, display },
      type: "client-chat",
      text: value,
    };

    mqtt.send(JSON.stringify(msg), false, `galaxy/room/${room?.room}/chat`);
    setValue("");
    
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={150}
    >
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={t("chat.newMsg")}
          value={value}
          onChangeText={setValue}
          returnKeyType="send"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.button, !value.trim() && styles.buttonDisabled]}
          onPress={forceSubmit}
          disabled={!value.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{t("chat.send")}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    padding: 10,
  },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "grey",
    padding: 10,
    height: 44,
    color: "white",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginRight: 10,
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0,
    backgroundColor: "blue",
    alignItems: "center",
    height: 44,
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#444",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
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
