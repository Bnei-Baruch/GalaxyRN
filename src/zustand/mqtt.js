import { create } from 'zustand';

export const useMqttStore = create((set) => ({
  mqttReady   : false,
  setMqttReady: (mqttReady = true) => set((state) => ({ mqttReady })),
}));