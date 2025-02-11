import { create } from 'zustand';
import { NativeModules, NativeEventEmitter } from 'react-native';
import InCallManager from 'react-native-incall-manager';

const { InCallManagerModule } = NativeModules;
const eventEmitter            = new NativeEventEmitter(InCallManagerModule);
let subscription;

const AUDIO_DEVICES = {
  WIRED_HEADSET: {
    icon    : 'headset',
    priority: 1,
    key     : 'WIRED_HEADSET'
  },
  BLUETOOTH    : {
    icon    : 'bluetooth-audio',
    priority: 2,
    key     : 'BLUETOOTH'
  },
  EARPIECE     : {
    icon    : 'volume-off',
    priority: 3,
    key     : 'EARPIECE'

  },
  SPEAKER_PHONE: {
    icon    : 'volume-up',
    priority: 4,
    key     : 'SPEAKER_PHONE'
  },
};

const useAudioDevicesStore = create((set, get) => ({
  selected  : null,
  select    : async (next) => {
    console.log('manage audio devices: useAudioDevicesStore select', next);

    const { availableAudioDeviceList, selectedAudioDevice } = await InCallManager.chooseAudioRoute(next);
    console.log('manage audio devices: useAudioDevicesStore select request', availableAudioDeviceList, selectedAudioDevice);
    const devices  = JSON.parse(availableAudioDeviceList).map(d => AUDIO_DEVICES[d]);
    const selected = AUDIO_DEVICES[selectedAudioDevice];

    console.log('manage audio devices: useAudioDevicesStore select mapped', devices, selected);
    set({ devices, selected });
  },
  devices   : [],
  setDevices: devices => set({ devices }),
  init      : () => {
    subscription = eventEmitter.addListener('onAudioDeviceChanged', async (d) => {
      const { availableAudioDeviceList, selectedAudioDevice } = d;
      console.log('manage audio devices: onAudioDeviceChanged', availableAudioDeviceList, selectedAudioDevice);
      const devices  = availableAudioDeviceList.map(d => AUDIO_DEVICES[d]);
      const selected = AUDIO_DEVICES[selectedAudioDevice];
      console.log('manage audio devices: onAudioDeviceChanged mapped', devices, selected);
      set({ devices, selected });
    });
    get().select('BLUETOOTH');
  },
  abort     : () => {
    subscription?.remove();
  }
}));
export default useAudioDevicesStore;