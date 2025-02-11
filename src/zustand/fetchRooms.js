import { create } from 'zustand';
import api from '../shared/Api';
import RNSecureStorage, { ACCESSIBLE } from 'rn-secure-storage';
import log from 'loglevel';
import { useSettingsStore } from './settings';
import { getFromStorage, setToStorage } from '../shared/tools';

const useRoomStore = create((set) => ({
  room      : null,
  setRoom   : (room) => {
    try {
      setToStorage('room', room.room.toString());
    } catch (err) {
      log.error('saved room: ', err);
    }
    set({ room });
  },
  isLoading : false,
  error     : null,
  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.fetchAvailableRooms();
      set({ isLoading: false });
      try {
        const id = await getFromStorage('room');

        const room = data.rooms.find(x => x.room === Number.parseInt(id));
        console.log('room from RNSecureStorage', id, room);

        set({ room });
        const { setReadyForJoin, autoEnterRoom } = useSettingsStore.getState();
        autoEnterRoom && setReadyForJoin(!!room);
      } catch (err) {
        log.error('saved room: ', err);
      }

      return data.rooms;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },
}));
export default useRoomStore;