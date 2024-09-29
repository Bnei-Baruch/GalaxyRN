import { create } from 'zustand';

export const useDevicesStore = create((set) => ({
  audio   : null,
  setAudio: (audio) => set((state) => ({ audio })),
  video   : null,
  setVideo: (video) => set((state) => ({ video })),
}));