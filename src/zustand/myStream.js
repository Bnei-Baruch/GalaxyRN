import { create } from 'zustand';
import { mediaDevices } from 'react-native-webrtc';
import RNSecureStorage from 'rn-secure-storage';

let stream             = null;
export const getStream = () => stream;

export const useMyStreamStore = create((set) => ({
  url          : null,
  mute         : true,
  cammmute     : true,
  init         : async () => {
    let cammute;
    try {
      cammute = await RNSecureStorage.getItem('cammute');
    } catch (e) {
      console.log(e);
    }
    console.log('useMyStreamStore init cammute', cammute);
    try {
      stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { frameRate: 30, width: 320, height: 180, facingMode: 'user' }
      });
    } catch (e) {
      console.error('Error accessing media devices:', e);
    }
    console.log('useMyStreamStore init', cammute, stream);
    set(() => ({ url: stream.toURL(), cammute }));
  },
  toggleMute   : () => {
    const enabled = !useMyStreamStore.getState().mute;
    stream.getAudioTracks().forEach(track => track.enabled = !enabled);
    set(() => ({ mute: enabled }));
  },
  toggleCammute: () => {
    const enabled = !useMyStreamStore.getState().cammute;
    console.log('toggleCammute', useMyStreamStore.getState().cammute, enabled);
    stream.getVideoTracks().forEach(track => track.enabled = !enabled);
    set(() => ({ cammute: enabled }));
  }
}));