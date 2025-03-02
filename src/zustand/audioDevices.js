import { create } from 'zustand';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AudioDeviceModule } = NativeModules;
const eventEmitter          = new NativeEventEmitter(AudioDeviceModule);
let subscription;

const TYPE_WIRED_HEADSET    = 3,
      TYPE_WIRED_HEADPHONES = 4,
      TYPE_USB_DEVICE       = 11,
      TYPE_BLUETOOTH_SCO    = 7,
      TYPE_BLUETOOTH_A2DP   = 8,
      TYPE_BUILTIN_SPEAKER  = 2,
      TYPE_BLE_HEADSET      = 26,
      TYPE_BUILTIN_EARPIECE = 1;


const deviceInfoToOption = d => {
  if (!d)
    return null;

  switch (d.type) {
    case TYPE_WIRED_HEADSET  :
      return { ...d, icon: 'headset-mic', priority: 1 };
    case TYPE_WIRED_HEADPHONES  :
      return { ...d, icon: 'headset', priority: 2 };
    case TYPE_USB_DEVICE  :
      return { ...d, icon: 'usb', priority: 3 };
    case TYPE_BLUETOOTH_SCO  :
      return { ...d, icon: 'bluetooth-audio', priority: 4 };
    case TYPE_BLUETOOTH_A2DP  :
      return { ...d, icon: 'media-bluetooth-on', priority: 5 };
    case TYPE_BUILTIN_EARPIECE  :
      return { ...d, icon: 'volume-off', priority: 6 };
    case TYPE_BLE_HEADSET  :
      return { ...d, icon: 'headset', priority: 7 };
    case TYPE_BUILTIN_SPEAKER  :
      return { ...d, icon: 'volume-up', priority: 8 };
    default:
      return { ...d, icon: 'hearing', priority: 9 };
  }
};

const useAudioDevicesStore = create((set, get) => ({
  selected: null,
  select  : async (id) => {
    console.log('manage audio devices: useAudioDevices select', id);
    await AudioDeviceModule.updateAudioDevices(id);
  },
  devices : [],
  initAudioDevices    : () => {
    console.log('manage audio devices: useAudioDevicesStore init');
    if (Platform.OS === 'android') {
      subscription = eventEmitter.addListener('updateAudioDevice', async (data) => {
        const devices  = Object.values(data)
          .map(deviceInfoToOption)
          .sort((a, b) => a.priority - b.priority);
        const selected = deviceInfoToOption(Object.values(data).find(d => d.active));
        set({ devices, selected });
      });
      AudioDeviceModule.initAudioDevices();
    }
  },
  abortAudioDevices   : () => {
    subscription?.remove();
  }
}));
export default useAudioDevicesStore;