import { create } from 'zustand';
import { mediaDevices } from 'react-native-webrtc';
import RNSecureStorage from 'rn-secure-storage';
import { useUserStore } from './user';

let stream             = null;
export const getStream = () => stream;

export const useMyStreamStore = create((set, get) => ({
  stream       : null,
  mute         : true,
  cammmute     : false,
  timestamp    : Date.now(),
  setTimestmap : () => set({ timestamp: Date.now() }),
  myInit       : async () => {
    let cammute;
    try {
      cammute = await RNSecureStorage.getItem('cammute');
    } catch (e) {
      console.log(e);
    }

    get().myAbort();

    try {
      stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'user' }
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
    stream.getAudioTracks().forEach(track => track.enabled = !mute);
    set(() => ({ mute: mute }));
  },
  toggleCammute: (cammute = !get().cammute) => {
    stream.getVideoTracks().forEach(track => track.enabled = !cammute);
    set(() => ({ cammute }));
    useUserStore.getState().sendUserState({ camera: !cammute });
  },
}));