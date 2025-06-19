import { Dimensions, StyleSheet } from 'react-native';

export const win = Dimensions.get('window');
export const w = win.width;
export const h = win.height;

export const baseStyles = StyleSheet.create({
  text: {
    color: 'white',
  },
  full: {
    flex: 1,
  },
  listItem: {
    padding: 10,
  },
  videoOverlay: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const AUDIO_DEVICE_TYPES = {
  TYPE_WIRED_HEADSET: 3,
  TYPE_WIRED_HEADPHONES: 4,
  TYPE_USB_DEVICE: 11,
  TYPE_USB_HEADSET: 3,
  TYPE_USB_ACCESSORY: 12,
  TYPE_BLUETOOTH_SCO: 7,
  TYPE_BLUETOOTH_A2DP: 8,
  TYPE_BUILTIN_SPEAKER: 2,
  TYPE_BLE_HEADSET: 26,
  TYPE_BUILTIN_EARPIECE: 1,
  TYPE_HEARING_AID: 23,
  TYPE_LINE_ANALOG: 5,
  TYPE_LINE_DIGITAL: 6,
  TYPE_TELEPHONY: 18,
};

export const AUDIO_DEVICE_TYPES_BY_KEY = Object.keys(AUDIO_DEVICE_TYPES).reduce(
  (acc, name) => {
    const id = AUDIO_DEVICE_TYPES[name];
    acc[id] = { name, id };
    return acc;
  },
  {}
);

export const SHIDUR_SUBTITLE_ZINDEX = 1;
export const SHIDUR_BAR_ZINDEX = 2;
