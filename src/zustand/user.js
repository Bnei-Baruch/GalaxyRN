// React Native modules
import { Platform } from 'react-native';

// External libraries
import { create } from 'zustand';

// Services
import logger from '../services/logger';

// Shared modules
import api from '../shared/Api';
import mqtt from '../shared/mqtt';

// Zustand stores
import useRoomStore from './fetchRooms';
import { useMyStreamStore } from './myStream';
import { useSettingsStore } from './settings';

const NAMESPACE = 'User';

export const useUserStore = create((set, get) => ({
  wip: false,
  setWIP: wip => set({ wip }),

  user: null,
  setUser: user => set({ user, wip: false }),

  vhinfo: {},
  setVhinfo: vhinfo => set({ vhinfo }),

  geoInfo: {},
  setGeoInfo: async () => {
    const geoInfo = await api.fetchGeoInfo();
    set({ geoInfo });
  },

  jannusInfo: {},
  setJannusInfo: info => {
    const jannusInfo = { ...info, timestamp: Date.now() };
    set({ jannusInfo });
  },

  extraInfo: {},
  setExtraInfo: extraInfo => {
    set({ extraInfo });
  },

  buildUserState: () => {
    const {
      room,
      description: group,
      janus,
    } = useRoomStore.getState().room || {};
    const { question } = useSettingsStore.getState();
    const { cammute } = useMyStreamStore.getState();
    const { vhinfo, user, geoInfo, extraInfo, jannusInfo } = get();

    const opts = {
      room,
      question,
      camera: !cammute,
      system: `${Platform.OS} ${Platform.Version}`,
      group,
      vhinfo,
      janus,
      isClient: true,
      allowed: vhinfo?.allowed,
      extra: extraInfo,
      ...geoInfo,
      ...jannusInfo,
      ...user,
    };

    return opts;
  },

  sendUserState: (updatedOpts = {}) => {
    const opts = {
      ...get().buildUserState(),
      ...updatedOpts,
    };

    if (!opts.room) {
      logger.warn(NAMESPACE, 'No room specified in sendUserState', opts);
      return;
    }

    const msg = { type: 'client-state', user: opts };
    logger.debug(NAMESPACE, 'Sending room message', msg);
    try {
      mqtt.send(JSON.stringify(msg), false, 'galaxy/room/' + opts.room);
    } catch (error) {
      logger.error(NAMESPACE, 'Error sending room message', error);
    }

    logger.debug(NAMESPACE, 'Sending gxydb message', opts);
    try {
      mqtt.send(JSON.stringify(opts), false, 'gxydb/users');
    } catch (error) {
      logger.error(NAMESPACE, 'Error sending gxydb message', error);
    }
  },
}));
