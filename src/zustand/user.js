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

  // on init user is undefined
  setUser: user => set({ user, wip: false }),

  vhinfo: null,
  setVhinfo: vhinfo => set({ vhinfo }),

  geoInfo: {},
  setGeoInfo: async () => {
    const geoInfo = await api.fetchGeoInfo();
    set({ geoInfo });
  },

  janusInfo: {},
  setJanusInfo: info => {
    const janusInfo = { ...info, timestamp: Date.now() };
    set({ janusInfo });
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
    const { vhinfo, user, geoInfo, extraInfo, janusInfo } = get();

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
      ...janusInfo,
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
  removeMember: async () => {
    logger.info(NAMESPACE, 'Removing member');
    await api.removeMember();
    set({ user: null });
  },
}));
