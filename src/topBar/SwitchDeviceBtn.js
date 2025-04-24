import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { useTranslation } from "react-i18next";
import useAudioDevicesStore from "../zustand/audioDevices";
import AudioBridge from "../services/AudioBridge";
import { baseStyles } from "../constants";
import Icon from "react-native-vector-icons/MaterialIcons";

export const SwitchDeviceBtn = () => {
  const { selected } = useAudioDevicesStore();
  const { t } = useTranslation();

  const handleSwitch = () => AudioBridge.switchAudioOutput();
  
  if (!selected) return null;

  return (
    <TouchableOpacity onPress={handleSwitch}>
      <Icon name={selected.icon} size={30} color="white" />
    </TouchableOpacity>
  );
};
