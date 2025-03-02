import { create } from 'zustand';
import useRoomStore from './fetchRooms';
import { useSettingsStore } from './settings';
import { useMyStreamStore } from './myStream';
import mqtt from '../shared/mqtt';

export const useUserStore = create((set, get) => ({
  wip          : false,
  setWIP       : (wip) => set({ wip }),
  user         : null,
  setUser      : (user) => set({ user, wip: false }),
  vhinfo       : {},
  setVhinfo    : (vhinfo) => set({ vhinfo }),
  rfid         : null,
  setRfid      : (rfid) => set({ rfid }),
  sendUserState: (opts = {}, adminOpts = {}) => {
    const { room, description: group, janus } = useRoomStore.getState()?.room || {};
    const { question }                        = useSettingsStore.getState();
    const { cammute }                         = useMyStreamStore.getState();
    const { vhinfo, user, rfid }              = get();

    if (!room) {
      console.log('sendUserState no room', room);
      return;
    }
    const defaultOpts = {
      rfid,
      room,
      question,
      camera: !cammute,
      ...opts
    };

    const msg = { type: 'client-state', user: { ...defaultOpts, ...opts } };
    console.log('sendUserState room message', msg);
    mqtt.send(JSON.stringify(msg), false, 'galaxy/room/' + room);

    const adminMsg = { ...user, ...msg.user, group, vhinfo, janus, ...adminOpts };
    console.log('sendUserState gxydb message', adminMsg);
    mqtt.send(JSON.stringify(adminMsg), false, 'gxydb/users');
  }
}));