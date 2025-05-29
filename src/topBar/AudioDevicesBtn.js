import * as React from "react";
import { Platform } from "react-native";
import { SwitchDeviceBtn } from "./SwitchDeviceBtn";
import { SelectDeviceBtn } from "./SelectDeviceBtn";

export const AudioDevicesBtn = () => {
  console.log("[RN render] AudioDevicesBtn", Platform.OS);
  if (Platform.OS === "ios") {
    return <SwitchDeviceBtn />;
  }
  return <SelectDeviceBtn />;
};
