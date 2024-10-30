import { create } from 'zustand';
import useRoomStore from './fetchRooms';
import { useMyStreamStore } from './myStream';
import { sendUserState } from '../shared/tools';
import { useUserStore } from './user';
import { ORIENTATIONS } from '../constants';

export const useSettingsStore = create((set) => ({
  uiLang           : 'en',
  changeUiLang     : (lang) => set({ uiLang: lang }),
  readyForJoin     : false,
  setReadyForJoin  : (readyForJoin = true) => set({ readyForJoin }),
  question         : false,
  toggleQuestion   : () => {
    const { room }     = useRoomStore.getState();
    const { rfid }     = useUserStore.getState();
    const { question } = useSettingsStore.getState();
    const { cammmute } = useMyStreamStore.getState();
    sendUserState({ camera: cammmute, question, room: room.room, rfid });
    set((state) => ({ question: !state.question }));
  },
  isBroadcast      : true,
  toggleIsBroadcast: () => set((state) => ({ isBroadcast: !state.isBroadcast })),
  isTen            : false,
  toggleIsTen      : () => set((state) => ({ isTen: !state.isTen })),
  audioMode        : false,
  toggleAudioMode  : () => set((state) => ({ audioMode: !state.audioMode })),
  showGroups       : false,
  toggleShowGroups : () => set((state) => ({ showGroups: !state.showGroups })),
}));