import { create } from 'zustand';
import useRoomStore from './fetchRooms';
import { useMyStreamStore } from './myStream';
import { sendUserState } from '../shared/tools';
import { useUserStore } from './user';
//import { NativeModules } from 'react-native';

//const { KeepAwakeModule } = NativeModules;

export const useSettingsStore = create((set, get) => ({
  uiLang           : 'en',
  changeUiLang     : (lang) => set({ uiLang: lang }),
  readyForJoin     : false,
  setReadyForJoin  : (readyForJoin = true) => set({ readyForJoin }),
  question         : false,
  toggleQuestion   : () => {
    const { room }     = useRoomStore.getState();
    const { rfid }     = useUserStore.getState();
    const { question } = get();
    const { cammmute } = useMyStreamStore.getState();
    sendUserState({ camera: cammmute, question, room: room.room, rfid });
    set((state) => ({ question: !state.question }));
  },
  isBroadcast      : true,
  toggleIsBroadcast: () => set((state) => ({ isBroadcast: !state.isBroadcast })),
  audioMode        : false,
  toggleAudioMode  : () => set((state) => {
    const audioMode = !state.audioMode;
   // KeepAwakeModule.activate(audioMode);
    return ({ audioMode });
  }),
  showGroups       : false,
  toggleShowGroups : () => set((state) => ({ showGroups: !state.showGroups })),
  hideSelf         : false,
  toggleHideSelf   : () => set((state) => ({ hideSelf: !state.hideSelf })),
}));