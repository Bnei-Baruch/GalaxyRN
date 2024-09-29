import { create } from 'zustand';
import api from '../shared/Api';
import RNSecureStorage, { ACCESSIBLE } from 'rn-secure-storage';
import log from 'loglevel';

const useRoomStore = create((set) => ({
  room      : null,
  setRoom   : (room) => {
    try {
      RNSecureStorage.setItem('room', room.room.toString(),
        { accessible: ACCESSIBLE.AFTER_FIRST_UNLOCK });
    } catch (err) {
      log.error('saved room: ', err);
    }
    set((state) => ({ room }));
  },
  isLoading : false,
  error     : null,
  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.fetchAvailableRooms();
      set({ isLoading: false });
      try {
        const id = await RNSecureStorage.getItem('room');

        const room = data.rooms.find(x => x.room === Number.parseInt(id));
        console.log('room from RNSecureStorage', id, room);
        set({ room });
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