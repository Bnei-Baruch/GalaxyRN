import { create } from 'zustand';

export const useUserStore = create((set) => ({
  password: '',
  token   : '',
  setToken: (token) => set(() => ({ token })),
  user    : null,
  setUser : (user) => set(() => ({ user })),

}));