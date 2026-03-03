import { Platform } from 'react-native';
import { create } from 'zustand';
import mqtt from '../libs/mqtt';
import api from '../services/Api';
import logger from '../services/logger';

import { useRoomStore } from './fetchRooms';
import { useMyStreamStore } from './myStream';
import { useSettingsStore } from './settings';

const NAMESPACE = 'User';

export const useUserStore = create((set, get) => ({
  wip: false,
  setWIP: wip => set({ wip }),

  // on init user must be undefined
  setUser: user => set({ user, wip: false }),

  vhinfo: null,
  setVhinfo: vhinfo => set({ vhinfo }),

  geoInfo: {},
  setGeoInfo: async () => {
    const geoInfo = await api.fetchGeoInfo();
    geoInfo.country_code = geoInfo.code;
    set({ geoInfo });
  },

  janusInfo: {},
  setJanusInfo: info => {
    const janusInfo = { ...info, timestamp: Date.now() };
    set({ janusInfo });
  },
  janusSrv: "",
  setJanusSrv: janusSrv => {
    set({ janusSrv });
  },

  extraInfo: {},
  setExtraInfo: extraInfo => {
    set({ extraInfo });
  },

  buildUserState: () => {
    const { room, description: group } = useRoomStore.getState().room || {};
    const { question } = useSettingsStore.getState();
    const { cammute } = useMyStreamStore.getState();
    const { vhinfo, user, geoInfo, extraInfo, janusInfo, janusSrv } = get();

    const opts = {
      room,
      question,
      camera: !cammute,
      system: `${Platform.OS} ${Platform.Version}`,
      group,
      vhinfo,
      janus: janusSrv,
      isClient: true,
      allowed: vhinfo?.allowed,
      extra: extraInfo,
      geo: geoInfo,
      ...janusInfo,
      ...user,
    };

    return opts;
  },

  //TODO: ceck if room need all users state
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

    get().sendGxydbState(opts);
  },

  sendGxydbState: opts => {
    logger.debug(NAMESPACE, 'Sending gxydb state', opts);
    opts = opts || get().buildUserState();

    logger.debug(NAMESPACE, 'Sending gxydb state', opts);
    try {
      mqtt.send(JSON.stringify(opts), false, 'gxydb/users');
    } catch (error) {
      logger.error(NAMESPACE, 'Error sending gxydb state', error);
    }
  },
  removeMember: async () => {
    logger.info(NAMESPACE, 'Removing member');
    await api.removeMember();
    set({ user: null });
  },
}));
