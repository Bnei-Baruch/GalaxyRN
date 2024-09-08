import { create } from 'zustand'

export const useUserStore = create((set) => ({
  username: '111',
  setName: (name) => set(() => ({ name })),
  password: '',
  token: '',
  setToken: (token) => set(() => ({ token })),
  user: '',
  setUser: (user) => set(() => ({ user })),
}))