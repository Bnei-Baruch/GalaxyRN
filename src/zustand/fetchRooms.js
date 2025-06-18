// External libraries
import { create } from 'zustand';

// Services
import logger from '../services/logger';

// Shared modules
import api from '../shared/Api';
import { getFromStorage, setToStorage } from '../shared/tools';

const NAMESPACE = 'FetchRooms';

const useRoomStore = create(set => ({
  room: null,
  setRoom: room => {
    room && setToStorage('room', room.room.toString());
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
        // const { autoEnterRoom } = useSettingsStore.getState();
        // const { setReadyForJoin } = useInitsStore.getState();
        // autoEnterRoom && setReadyForJoin(!!room);
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
