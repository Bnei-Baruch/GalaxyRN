// React Native modules
import { Platform } from 'react-native';

// External libraries
import { create } from 'zustand';

// Constants
import { AUDIO_DEVICE_TYPES, AUDIO_DEVICE_TYPES_BY_KEY } from '../constants';

// Services
import AudioBridge from '../services/AudioBridge';
import logger from '../services/logger';

const NAMESPACE = 'AudioDevices';

const eventEmitter = AudioBridge.getEventEmitter();
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
  wip: false,

  select: async id => {
    set({ wip: true });
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
      logger.debug(
        NAMESPACE,
        'Setting up event listener for updateAudioDevice'
      );
      subscription = eventEmitter.addListener(
        'updateAudioDevice',
        async data => {
          logger.debug(NAMESPACE, 'updateAudioDevice event received', data);
          logger.debug(NAMESPACE, 'Raw event data type:', typeof data);
          logger.debug(
            NAMESPACE,
            'Raw event data keys:',
            Object.keys(data || {})
          );

          const devices = Object.values(data)
            .map(deviceInfoToOption)
            .sort((a, b) => a.priority - b.priority);
          const selected = deviceInfoToOption(
            Object.values(data).find(d => d.active)
          );

          logger.debug(NAMESPACE, 'Processed devices:', devices);
          logger.debug(NAMESPACE, 'Selected device:', selected);

          set({ devices, selected, wip: false });
        }
      );

      logger.debug(NAMESPACE, 'Event listener set up successfully');
      AudioBridge.initAudioDevices();
    } catch (error) {
      logger.error(NAMESPACE, 'Error in initAudioDevices:', error);
    }
  },

  abortAudioDevices: () => {
    logger.info(NAMESPACE, 'abortAudioDevices called');
    if (subscription) {
      logger.debug(NAMESPACE, 'Removing event listener subscription');
      subscription.remove();
      subscription = null;
      logger.debug(NAMESPACE, 'Event listener subscription removed');
    } else {
      logger.debug(NAMESPACE, 'No subscription to remove');
    }

    try {
      AudioBridge.abandonAudioFocus();
      logger.debug(NAMESPACE, 'Audio focus abandoned successfully');
    } catch (error) {
      logger.error(NAMESPACE, 'Error abandoning audio focus:', error);
    }
  },
}));

export default useAudioDevicesStore;
