// React Native modules

// External libraries
import { create } from 'zustand';

import { APP_SESSION } from '../libs/sentry/constants';
import { addSpan, finishSpan } from '../libs/sentry/sentryHelper';
// Constants

// Services
import AudioBridge from '../services/AudioBridge';
import logger from '../services/logger';

const NAMESPACE = 'AudioDevices';

const eventEmitter = AudioBridge.getEventEmitter();
let subscription = null;

const deviceInfoToOption = d => {
  if (!d) return null;
  let res = { ...d };
  logger.debug(NAMESPACE, 'deviceInfoToOption called with:', d);
  switch (d.type.toLowerCase()) {
    case 'headphones':
      return { ...res, icon: 'headset' };
    case 'external':
      return { ...res, icon: 'hearing' };
    case 'caraudio':
      return { ...res, icon: 'directions-car' };
    case 'bluetooth':
      return { ...res, icon: 'bluetooth-audio' };
    case 'earpiece':
      return { ...res, icon: 'volume-off' };
    case 'speaker':
      return { ...res, icon: 'volume-up' };
    default:
      return { ...res, icon: 'hearing' };
  }
};

export const useAudioDevicesStore = create((set, get) => ({
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
          const span = addSpan(APP_SESSION, 'updateAudioDevice', data);

          const devices = Object.values(data)
            .map(deviceInfoToOption)
            .sort((a, b) => a.priority - b.priority);
          const selected = deviceInfoToOption(
            Object.values(data).find(d => d.active)
          );

          logger.debug(NAMESPACE, 'Processed devices:', devices);
          logger.debug(NAMESPACE, 'Selected device:', selected);

          set({ devices, selected, wip: false });
          finishSpan(span, 'ok');
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
