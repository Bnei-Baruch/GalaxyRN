import { create } from 'zustand';
import mqtt from '../shared/mqtt';
import produce from 'immer';
import { getDateString } from '../shared/tools';

const buildMsg            = (msg) => ({ ...msg, time: getDateString() });
export const chatModes    = {
  close   : 0,
  chat    : 1,
  support : 2,
  question: 3,
};
export const useChatStore = create((set) => ({
  mode        : chatModes.close,
  setChatMode : (mode) => set(() => ({ mode })),
  supportCount: 0,
  roomCount   : 0,
  supportMsgs : [],
  roomMsgs    : [
    {
      'text': '55',
      'time': '09:42:19',
      'type': 'client-chat',
      'user': { 'display': 'davgur davgur', 'id': '4d902c81-dac2-46eb-89bd-94ce926e4c85', 'role': 'user' }
    }, {
      'text': '66',
      'time': '09:42:32',
      'type': 'client-chat',
      'user': { 'display': 'davgur davgur', 'id': '4d902c81-dac2-46eb-89bd-94ce926e4c85', 'role': 'user' }
    }
  ],
  resetRoom   : set(() => ({ roomCount: 0 })),
  resetSupport: set(() => ({ supportCount: 0 })),
  initRoom    : () => {
    mqtt.mq.on('MqttChatEvent', (data) => {
      let json = JSON.parse(data);
      if (json?.type === 'client-chat') {
        set(produce(state => {
          state.roomCount++;
          state.roomMsgs.push(buildMsg(json));
        }));
      }
    });
  },
  initSupport : () => {
    mqtt.mq.on('MqttChatEvent', (data) => {
      let json = JSON.parse(data);
      if (json?.type === 'client-chat') {
        set(produce(state => {
          state.supportCount++;
          state.supportMsgs.push(buildMsg(json));
        }));
      }
    });
  }
}));