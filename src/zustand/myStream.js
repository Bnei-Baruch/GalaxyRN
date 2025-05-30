import { create } from 'zustand';
import { mediaDevices } from 'react-native-webrtc';
import { useUserStore } from './user';
import { getFromStorage, setToStorage } from '../shared/tools';

let stream             = null;
export const getStream = () => stream;

export const useMyStreamStore = create((set, get) => ({
  stream       : null,
  mute         : true,
  cammute     : false,
  timestamp    : Date.now(),
  myInit       : async () => {
    const cammute = await getFromStorage('cammute').then(x => x === 'true');
    get().myAbort();

    try {
      stream = await mediaDevices.getUserMedia({
        video: {
          /*
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 },
          profileLevelId: "42e01f"
          */
          facingMode: 'user',
        },
        audio: {
          /*echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1*/
        },
      });
    } catch (e) {
      console.error('Error accessing media devices:', e);
    }
    set(() => ({ stream, cammute }));
  },
  myAbort      : () => {
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  },
  toggleMute   : (mute = !get().mute) => {
    stream?.getAudioTracks().forEach(track => track.enabled = !mute);
    set(() => ({ mute: mute }));
  },
  toggleCammute: async (cammute = !get().cammute, updateStorage = true) => {
    useUserStore.getState().sendUserState({ camera: !cammute });
    stream?.getVideoTracks().forEach(track => track.enabled = !cammute);
    set(() => ({ cammute }));
    updateStorage && await setToStorage('cammute', cammute);
  },
}));