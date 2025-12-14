import { NativeModules, Platform } from 'react-native';
import { mediaDevices } from 'react-native-webrtc';
import { create } from 'zustand';
import logger from '../services/logger';
import { getFromStorage, setToStorage } from '../tools';
import { useUserStore } from './user';

const NAMESPACE = 'MyStream';

let stream = null;

export const getStream = async () => {
  if (!stream) {
    logger.warn(NAMESPACE, 'Stream is null, attempting to initialize...');
    try {
      await useMyStreamStore.getState().myInit();
    } catch (error) {
      logger.error(NAMESPACE, 'Failed to initialize stream:', error);
    }
  }

  return stream;
};

export const useMyStreamStore = create((set, get) => ({
  stream: null,
  mute: true,
  cammute: false,
  timestamp: Date.now(),

  myInit: async () => {
    const cammute = await getFromStorage('cammute').then(x => x === 'true');
    get().myAbort();

    try {
      stream = await mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 },
        },
        audio: {},
      });
    } catch (e) {
      logger.error(NAMESPACE, 'Error accessing media devices:', e);
      throw e;
    }

    set(() => ({ stream, cammute }));
  },

  myAbort: () => {
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  },

  toggleMute: (mute = !get().mute) => {
    stream?.getAudioTracks().forEach(track => (track.enabled = !mute));
    set(() => ({ mute }));

    if (Platform.OS !== 'android') return;
    logger.debug(NAMESPACE, 'toggleMute', mute);
    try {
      if (mute) {
        NativeModules.ForegroundModule?.setMicOff();
      } else {
        NativeModules.ForegroundModule?.setMicOn();
      }
    } catch (error) {
      logger.error(NAMESPACE, 'Error toggling mute:', error);
    }
  },

  toggleCammute: async (cammute = !get().cammute, updateStorage = true) => {
    useUserStore.getState().sendUserState({ camera: !cammute });
    stream?.getVideoTracks().forEach(track => (track.enabled = !cammute));
    set(() => ({ cammute }));
    updateStorage && (await setToStorage('cammute', cammute));
  },
}));
