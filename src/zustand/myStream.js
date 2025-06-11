import { mediaDevices } from 'react-native-webrtc';
import { create } from 'zustand';
import logger from '../services/logger';
import { getFromStorage, setToStorage } from '../shared/tools';
import { useUserStore } from './user';

const NAMESPACE = 'MyStream';

let stream = null;

export const getStream = async () => {
  if (!stream) {
    logger.warn(NAMESPACE, "[client] Stream is null, attempting to initialize...");
    try {
      await useMyStreamStore.getState().myInit();
    } catch (error) {
      logger.error(NAMESPACE, "[client] Failed to initialize stream:", error);
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
        },
        audio: {
          // echoCancellation: true,
          // noiseSuppression: true,
          // autoGainControl: true,
          // channelCount: 1
        },
      });
    } catch (e) {
      logger.error(NAMESPACE, 'Error accessing media devices:', e);
    }
    
    set(() => ({ stream, cammute }));
  },
  
  myAbort: () => {
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  },
  
  toggleMute: (mute = !get().mute) => {
    stream?.getAudioTracks().forEach(track => track.enabled = !mute);
    set(() => ({ mute }));
  },
  
  toggleCammute: async (cammute = !get().cammute, updateStorage = true) => {
    useUserStore.getState().sendUserState({ camera: !cammute });
    stream?.getVideoTracks().forEach(track => track.enabled = !cammute);
    set(() => ({ cammute }));
    updateStorage && await setToStorage('cammute', cammute);
  },
}));