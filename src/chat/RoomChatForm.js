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
import mqtt from "../shared/mqtt";
import { useTranslation } from "react-i18next";

export const RoomChatForm = () => {
  const [value, setValue] = useState("");
  const { t } = useTranslation();

  const { room } = useRoomStore();
  const { user } = useUserStore();

  if (!room?.room) return null;

  const newChatMessage = () => {
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
      behavior={Platform.OS === "ios" ? "position" : "height"}
      keyboardVerticalOffset={45}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder={t("chat.newMsg")}
          placeholderTextColor="gray"
          value={value}
          onChangeText={setValue}
          color="white"
        />
        <Button
          size={30}
          positive
          onPress={newChatMessage}
          title={t("chat.send")}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor: "grey",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
    backgroundColor: "#333",
  },
  input: {
    flex: 1,
    marginRight: 10,
    padding: 8,
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
