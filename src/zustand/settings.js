import { create } from 'zustand'

export const useSettingsStore = create((set) => ({
  uiLang: 'en',
  changeUiLang: (lang) => set((state) => ({ uiLang: lang })),
  joined: false,
  joinRoom: () => set((state) => ({ joined: true })),
  muted: true,
  toggleMuted: () => set((state) => ({ muted: !state.muted })),
  cammuted: false,
  toggleCammuted: () => set((state) => ({ cammuted: !state.cammuted })),
  question: false,
  toggleQuestion: () => set((state) => ({ question: !state.question })),
  isBroadcast: true,
  toggleIsBroadcast: () => set(
    (state) => { return ({ isBroadcast: !state.isBroadcast }) }),
  isTen: false,
  toggleIsTen: () => set(
    (state) => { return ({ isTen: !state.isTen }) }),

}))