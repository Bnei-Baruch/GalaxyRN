import { create } from 'zustand';

import { STORAGE_KEYS } from '../constants';
import api from '../services/Api';
import logger from '../services/logger';
import { getFromStorage, setToStorage } from '../tools';

const NAMESPACE = 'FetchRooms';

export const useRoomStore = create((set, get) => ({
  room: null,
  rooms: [],
  setRoom: async room => {
    if (!room?.room || !room.janus) {
      logger.debug(NAMESPACE, `room is ${JSON.stringify(room)} in setRoom`);
      set({ room: null });
      return;
    }

    try {
      await setToStorage(STORAGE_KEYS.ROOM, room.room.toString());
    } catch (error) {
      logger.error(NAMESPACE, 'Error setting room to storage', error);
      throw new Error('Error setting room to storage');
    }

    set({ room });
  },

  isLoading: false,
  error: null,

  fetchRooms: async () => {

    logger.debug(NAMESPACE, 'fetchRooms', get().rooms.length);
    if (get().rooms.length === 0) {
      logger.debug(NAMESPACE, 'fetchRooms fetching rooms');
      set({ isLoading: true, error: null });
      try {
        const data = await api.fetchAvailableRooms();
        set({ isLoading: false, rooms: data.rooms });
      } catch (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
    }


    try {
      const id = await getFromStorage(STORAGE_KEYS.ROOM);
      const room = get().rooms.find(x => x.room === Number.parseInt(id));
      logger.debug(NAMESPACE, 'room from RNSecureStorage', id, room);

      set({ room });
    } catch (err) {
      logger.error(NAMESPACE, 'saved room: ', err);
    }
  },
  selectRoomOpen: false,
  setSelectRoomOpen: (selectRoomOpen = !get().selectRoomOpen) => {
    set({ selectRoomOpen });
  },
}));
