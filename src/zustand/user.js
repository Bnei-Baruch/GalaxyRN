import { create } from 'zustand';
import useRoomStore from './fetchRooms';
import { useSettingsStore } from './settings';
import { useMyStreamStore } from './myStream';
import mqtt from '../shared/mqtt';

export const useUserStore = create((set, get) => ({
  user         : null,
  setUser      : (user) => set({ user }),
  vhinfo       : {},
  setVhinfo    : (vhinfo) => set({ vhinfo }),
  rfid         : null,
  setRfid      : (rfid) => set({ rfid }),
  sendUserState: (opts = {}, adminOpts = {}) => {
    const { room: { room, description: group, janus } = {} } = useRoomStore.getState();
    const { question }                                       = useSettingsStore.getState();
    const { cammute }                                        = useMyStreamStore.getState();
    const { vhinfo, user, rfid }                             = get();

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
    const extra    = {
      'streams': [
        {
          'type'        : 'video',
          'mindex'      : 0,
          'mid'         : '0',
          'codec'       : 'h264',
          'h264_profile': '42e01f'
        },
        {
          'type'  : 'audio',
          'mindex': 1,
          'mid'   : '1',
          'codec' : 'opus',
          'fec'   : true
        }
      ],
      'isGroup': false
    };
    const adminMsg = { ...user, ...msg.user, group, extra, vhinfo, janus, ...adminOpts };
    console.log('sendUserState gxydb message', adminMsg);
    mqtt.send(JSON.stringify(msg), false, 'gxydb/users');
  }
}));