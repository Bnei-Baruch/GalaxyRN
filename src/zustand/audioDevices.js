// React Native modules
import { NativeEventEmitter, Platform } from 'react-native';

// External libraries
import { create } from 'zustand';

// Constants
import { AUDIO_DEVICE_TYPES, AUDIO_DEVICE_TYPES_BY_KEY } from '../constants';

// Services
import AudioBridge from '../services/AudioBridge';
import logger from '../services/logger';

const NAMESPACE = 'AudioDevices';

const eventEmitter = new NativeEventEmitter(AudioBridge.raw);
let subscription = null;

const deviceInfoToOptionAndroid = d => {
  if (!d) return null;
  let res = { ...d, name: AUDIO_DEVICE_TYPES_BY_KEY[d.type]?.name };
  switch (d.type) {
    case AUDIO_DEVICE_TYPES.TYPE_WIRED_HEADSET:
      return { ...res, icon: 'headset-mic', priority: 1 };
    case AUDIO_DEVICE_TYPES.TYPE_WIRED_HEADPHONES:
      return { ...res, icon: 'headset', priority: 2 };
    case AUDIO_DEVICE_TYPES.TYPE_USB_DEVICE:
    case AUDIO_DEVICE_TYPES.TYPE_USB_HEADSET:
    case AUDIO_DEVICE_TYPES.TYPE_USB_ACCESSORY:
      return { ...res, icon: 'usb', priority: 3 };
    case AUDIO_DEVICE_TYPES.TYPE_BLUETOOTH_SCO:
      return { ...res, icon: 'bluetooth-audio', priority: 4 };
    case AUDIO_DEVICE_TYPES.TYPE_BLUETOOTH_A2DP:
      return { ...res, icon: 'media-bluetooth-on', priority: 5 };
    case AUDIO_DEVICE_TYPES.TYPE_BUILTIN_EARPIECE:
      return { ...res, icon: 'volume-off', priority: 6 };
    case AUDIO_DEVICE_TYPES.TYPE_BLE_HEADSET:
      return { ...res, icon: 'headset', priority: 7 };
    case AUDIO_DEVICE_TYPES.TYPE_BUILTIN_SPEAKER:
      return { ...res, icon: 'volume-up', priority: 8 };
    default:
      return { ...res, icon: 'hearing', priority: 9 };
  }
};

const deviceInfoToOptionIOS = d => {
  if (!d) return null;
  let res = { ...d };
  switch (d.type.toLowerCase()) {
    case 'headphones':
      return { ...res, icon: 'headset' };
    case 'external':
      return { ...res, icon: 'Speaker' };
    case 'bluetooth':
      return { ...res, icon: 'bluetooth-audio' };
    case 'earpiece':
      return { ...res, icon: 'volume-off', priority: 6 };
    case 'speaker':
      return { ...res, icon: 'volume-up', priority: 8 };
    default:
      return { ...res, icon: 'hearing', priority: 9 };
  }
};

const deviceInfoToOption =
  Platform.OS === 'android' ? deviceInfoToOptionAndroid : deviceInfoToOptionIOS;

const useAudioDevicesStore = create((set, get) => ({
  selected: null,

  select: async id => {
    logger.debug(NAMESPACE, 'select called with id:', id);
    await AudioBridge.updateAudioDevices(id);
  },

  devices: [],

  initAudioDevices: () => {
    logger.info(NAMESPACE, 'initAudioDevices called');
    if (subscription) {
      logger.debug(NAMESPACE, 'Removing existing subscription');
      subscription.remove();
      subscription = null;
    }

    try {
      subscription = eventEmitter.addListener(
        'updateAudioDevice',
        async data => {
          logger.debug(NAMESPACE, 'updateAudioDevice event received', data);
          const devices = Object.values(data)
            .map(deviceInfoToOption)
            .sort((a, b) => a.priority - b.priority);
          const selected = deviceInfoToOption(
            Object.values(data).find(d => d.active)
          );
          set({ devices, selected });
        }
      );

      AudioBridge.initAudioDevices();
    } catch (error) {
      logger.error(NAMESPACE, 'Error in initAudioDevices:', error);
    }
  },

  abortAudioDevices: () => {
    logger.info(NAMESPACE, 'abortAudioDevices called');
    if (subscription) {
      AudioBridge.abandonAudioFocus();
      subscription.remove();
      subscription = null;
    }
  },
}));

export default useAudioDevicesStore;
