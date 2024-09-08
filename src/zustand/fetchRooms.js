import { create } from 'zustand'
import api from '../shared/Api'

const useRoomStore = create((set) => ({
  room: null,
  setRoom: (room) => set((state) => ({ room })),
  isLoading: false,
  error: null,
  fetchRooms: async (authParams) => {
    console.log('useRoomStore fetch rooms')
    set({ isLoading: true, error: null })
    try {
      const url = api.urlFor('/groups')
      const data = await api.logAndParse('fetch available rooms',
        fetch(`${url}`, authParams))
      console.error(`fetchRooms success`, data.rooms?.length)
      set({ rooms: data.rooms, isLoading: false })
      return data.rooms
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return []
    }
  },
}))
export default useRoomStore