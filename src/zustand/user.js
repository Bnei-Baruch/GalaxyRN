import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user   : null,
  setUser: (user) => set(() => ({ user })),
  rfid   : null,
  setRfid: (rfid) => set({ rfid }),
}));