import { create } from 'zustand';

export const useSettingsStore = create((set) => ({
  uiLang           : 'en',
  changeUiLang     : (lang) => set(() => ({ uiLang: lang })),
  readyForJoin     : false,
  setReadyForJoin  : (readyForJoin = true) => set(() => ({ readyForJoin })),
  muted            : true,
  toggleMuted      : () => set((state) => ({ muted: !state.muted })),
  cammuted         : false,
  setCammuted      : (cammuted) => set(
    (state) => ({ cammuted: cammuted ?? !state.cammuted })),
  question         : false,
  toggleQuestion   : () => set((state) => ({ question: !state.question })),
  isBroadcast      : true,
  toggleIsBroadcast: () => set(
    (state) => {
      return ({ isBroadcast: !state.isBroadcast });
    }),
  isTen            : false,
  toggleIsTen      : () => set(
    (state) => {
      return ({ isTen: !state.isTen });
    }),

}));