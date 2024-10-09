import { create } from 'zustand';

export const useSettingsStore = create((set) => ({
  uiLang           : 'en',
  changeUiLang     : (lang) => set({ uiLang: lang }),
  readyForJoin     : false,
  setReadyForJoin  : (readyForJoin = true) => set({ readyForJoin }),
  question         : false,
  toggleQuestion   : () => set((state) => ({ question: !state.question })),
  isBroadcast      : true,
  toggleIsBroadcast: () => set((state) => ({ isBroadcast: !state.isBroadcast })),
  isTen            : false,
  toggleIsTen      : () => set((state) => ({ isTen: !state.isTen })),
  audioMode        : false,
  toggleAudioMode  : () => set((state) => ({ audioMode: !state.audioMode })),
}));