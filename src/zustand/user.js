import { Platform } from "react-native";
import { create } from "zustand";
import useRoomStore from "./fetchRooms";
import { useSettingsStore } from "./settings";
import { useMyStreamStore } from "./myStream";
import mqtt from "../shared/mqtt";
import api from "../shared/Api";

export const useUserStore = create((set, get) => ({
  wip: false,
  setWIP: (wip) => set({ wip }),
  user: null,
  setUser: (user) => set({ user, wip: false }),
  vhinfo: {},
  setVhinfo: (vhinfo) => set({ vhinfo }),
  geoInfo: {},
  setGeoInfo: async () => {
    const geoInfo = await api.fetchGeoInfo();
    set({ geoInfo });
  },
  jannusInfo: {},
  setJannusInfo: (info) => {
    const jannusInfo = { ...info, timestamp: Date.now() };
    set({ jannusInfo });
  },
  extraInfo: {},
  setExtraInfo: (extraInfo) => {
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
      console.log("sendUserState no room", opts.room);
      return;
    }

    const msg = { type: "client-state", user: opts };
    console.log("sendUserState room message", msg);
    try {
      mqtt.send(JSON.stringify(msg), false, "galaxy/room/" + opts.room);
    } catch (error) {
      console.log("sendUserState room message error", error);
    }

    console.log("sendUserState gxydb message", opts);
    try {
      mqtt.send(JSON.stringify(opts), false, "gxydb/users");
    } catch (error) {
      console.log("sendUserState gxydb message error", error);
    }
  },
}));
