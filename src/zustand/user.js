import { create } from 'zustand';
import useRoomStore from './fetchRooms';
import { useSettingsStore } from './settings';
import { useMyStreamStore } from './myStream';
import mqtt from '../shared/mqtt';

export const useUserStore = create((set, get) => ({
  user         : null,
  setUser      : (user) => set(() => ({ user })),
  rfid         : null,
  setRfid      : (rfid) => set({ rfid }),
  sendUserState: (opts = {}) => {
    const { room }     = useRoomStore.getState();
    const { question } = useSettingsStore.getState();
    const { cammmute } = useMyStreamStore.getState();
    const defaultOpts  = {
      camera: !cammmute,
      question,
      rfid  : get().rfid,
      room  : room.room,
      ...opts
    };

    const msg = { type: 'client-state', user: { ...defaultOpts, ...opts } };
    console.log('sendUserState', msg, room);
    mqtt.send(JSON.stringify(msg), false, 'galaxy/room/' + room.room);
  }
}));