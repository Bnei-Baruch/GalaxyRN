import { create } from 'zustand';

import logger from '../services/logger';
import api from '../shared/Api';
import { getFromStorage, setToStorage } from '../shared/tools';

const NAMESPACE = 'FetchRooms';

const useRoomStore = create(set => ({
  room: null,
  setRoom: async room => {
    if (!room?.room || !room.janus) {
      logger.debug(NAMESPACE, `room is ${JSON.stringify(room)} in setRoom`);
      set({ room: null });
      return;
    }

    try {
      await setToStorage('room', room.room.toString());
    } catch (error) {
      logger.error(NAMESPACE, 'Error setting room to storage', error);
      throw new Error('Error setting room to storage');
    }

    set({ room });
  },

  isLoading: false,
  error: null,

  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.fetchAvailableRooms();
      set({ isLoading: false });
      try {
        const id = await getFromStorage('room');

        const room = data.rooms.find(x => x.room === Number.parseInt(id));
        logger.debug(NAMESPACE, 'room from RNSecureStorage', id, room);

        set({ room });
      } catch (err) {
        logger.error(NAMESPACE, 'saved room: ', err);
      }

      return data.rooms;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },
}));

export default useRoomStore;
