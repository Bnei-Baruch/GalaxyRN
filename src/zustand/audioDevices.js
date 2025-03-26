import { create } from "zustand";
import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import { AUDIO_DEVICE_TYPES, AUDIO_DEVICE_TYPES_BY_KEY } from "../constants";

const { AudioDeviceModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(AudioDeviceModule);
let subscription = null;

const deviceInfoToOption = (d) => {
  if (!d) return null;
  let res = { ...d, name: AUDIO_DEVICE_TYPES_BY_KEY[d.type]?.name };
  switch (d.type) {
    case AUDIO_DEVICE_TYPES.TYPE_WIRED_HEADSET:
      return { ...res, icon: "headset-mic", priority: 1 };
    case AUDIO_DEVICE_TYPES.TYPE_WIRED_HEADPHONES:
      return { ...res, icon: "headset", priority: 2 };
    case AUDIO_DEVICE_TYPES.TYPE_USB_DEVICE:
    case AUDIO_DEVICE_TYPES.TYPE_USB_HEADSET:
    case AUDIO_DEVICE_TYPES.TYPE_USB_ACCESSORY:
      return { ...res, icon: "usb", priority: 3 };
    case AUDIO_DEVICE_TYPES.TYPE_BLUETOOTH_SCO:
      return { ...res, icon: "bluetooth-audio", priority: 4 };
    case AUDIO_DEVICE_TYPES.TYPE_BLUETOOTH_A2DP:
      return { ...res, icon: "media-bluetooth-on", priority: 5 };
    case AUDIO_DEVICE_TYPES.TYPE_BUILTIN_EARPIECE:
      return { ...res, icon: "volume-off", priority: 6 };
    case AUDIO_DEVICE_TYPES.TYPE_BLE_HEADSET:
      return { ...res, icon: "headset", priority: 7 };
    case AUDIO_DEVICE_TYPES.TYPE_BUILTIN_SPEAKER:
      return { ...res, icon: "volume-up", priority: 8 };
    default:
      return { ...res, icon: "hearing", priority: 9 };
  }
};

const useAudioDevicesStore = create((set, get) => ({
  selected: null,
  select: async (id) => {
    console.log("[audioDevices] select called with id:", id);
    await AudioDeviceModule.updateAudioDevices(id);
  },
  devices: [],
  initAudioDevices: () => {
    console.log("[audioDevices] initAudioDevices called");
    if (Platform.OS === "android") {
      // Clean up existing subscription if any
      if (subscription) {
        console.log("[audioDevices] Removing existing subscription");
        subscription.remove();
        subscription = null;
      }

      try {
        subscription = eventEmitter.addListener(
          "updateAudioDevice",
          async (data) => {
            console.log(
              "[audioDevices] updateAudioDevice event received",
              data
            );
            const devices = Object.values(data)
              .map(deviceInfoToOption)
              .sort((a, b) => a.priority - b.priority);
            const selected = deviceInfoToOption(
              Object.values(data).find((d) => d.active)
            );
            console.log("[audioDevices] Setting new state", {
              devices,
              selected,
            });
            set({ devices, selected });
          }
        );
        AudioDeviceModule.initAudioDevices();
      } catch (error) {
        console.error("[audioDevices] Error in initAudioDevices:", error);
      }
    }
  },
  abortAudioDevices: () => {
    console.log("[audioDevices] abortAudioDevices called");
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
  },
}));

export default useAudioDevicesStore;
