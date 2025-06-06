import React from "react";
import { TouchableOpacity } from "react-native";
import useAudioDevicesStore from "../zustand/audioDevices";
import AudioBridge from "../services/AudioBridge";
import Icon from "react-native-vector-icons/MaterialIcons";

export const SwitchDeviceBtn = () => {
  const { selected } = useAudioDevicesStore();

  const handleSwitch = () => AudioBridge.switchAudioOutput();

  if (!selected) return null;

  return (
    <TouchableOpacity onPress={handleSwitch}>
      <Icon name={selected.icon} size={30} color="white" />
    </TouchableOpacity>
  );
};
