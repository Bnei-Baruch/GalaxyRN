import { create } from 'zustand';
import { NativeModules, NativeEventEmitter } from 'react-native';
import InCallManager from 'react-native-incall-manager';

const { AppModule } = NativeModules;
const eventEmitter  = new NativeEventEmitter(AppModule);
let subscription;

const SPEAKER_PHONE = 1, WIRED_HEADSET = 2, EARPIECE = 3, BLUETOOTH = 4;
const audioDevices  = {
  WIRED_HEADSET: {
    icon    : 'headset',
    priority: 1,
  },
  BLUETOOTH    : {
    icon    : 'bluetooth-audio',
    priority: 2,
  },
  EARPIECE     : {
    icon    : 'volume-up',
    priority: 3,

  },
  SPEAKER_PHONE: {
    icon    : 'volume-off',
    priority: 4,
  },
};

const useAudioDevicesStore = create((set, get) => ({
  selected  : null,
  select    : async (next) => {

    const { availableAudioDeviceList, selectedAudioDevice } = await InCallManager.chooseAudioRoute(next);

    const devices  = availableAudioDeviceList.map(d => audioDevices[d]);
    const selected = audioDevices[selectedAudioDevice];
    set({ devices, selected });
  },
  devices   : [],
  setDevices: devices => set({ devices }),
  init      : () => {
    subscription = eventEmitter.addListener('onAudioDeviceChanged', async (d) => {
      const { availableAudioDeviceList, selectedAudioDevice } = d;

      const devices  = availableAudioDeviceList.map(d => audioDevices[d]);
      const selected = audioDevices[selectedAudioDevice];
      set({ devices, selected });
    });
  },
  abort     : () => {
    subscription?.remove();
  }
}));
export default useAudioDevicesStore;