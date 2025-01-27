import { create } from 'zustand';
import produce from 'immer';
import { getDateString } from '../shared/tools';
import { modalModes } from './helper';
import Api from '../shared/Api';
import { isRTLString } from '../chat/helper';

const buildMsg = (msg) => ({ ...msg, time: getDateString() });

export const useChatStore = create((set, get) => ({
  mode         : modalModes.close,
  setChatMode  : (mode) => set(() => ({ mode })),
  supportCount : 0,
  roomCount    : 0,
  supportMsgs  : [],
  roomMsgs     : [],
  questions    : [],
  resetRoom    : set(() => ({ roomCount: 0 })),
  resetSupport : set(() => ({ supportCount: 0 })),
  addRoomMsg   : (data) => {
    let json = JSON.parse(data);
    if (json?.type === 'client-chat') {
      set(produce(state => {
        state.roomCount++;
        state.roomMsgs.push(buildMsg(json));
      }));
    }
  },
  addSupportMsg: (data) => {
    let json = JSON.parse(data);
    if (json?.type === 'client-chat') {
      set(produce(state => {
        state.supportCount++;
        state.supportMsgs.push(buildMsg(json));
      }));
    }
  },
  cleanChat    : () => {
    set(produce(state => {
      state.supportCount = 0;
      state.supportMsgs  = [];
      state.roomCount    = 0;
      state.roomMsgs     = [];
    }));
  },
  sendQuestion : (data) => {
    Api.sendQuestion(data);
    get().getQuestions({ serialUserId: data.serialUserId });
  },
  getQuestions : async (data) => {
    const questions = await Api.getQuestions(data);
    questions.map(q => {
      const { question: { content, askForMe }, user: { galaxyRoom: room, name }, timestamp } = q;
      return {
        room,
        name,
        content,
        askForMe,
        time     : getDateString(new Date(timestamp)),
        direction: isRTLString(content) ? 'rtl' : 'ltr',
        textAlign: isRTLString(content) ? 'right' : 'left',
      };
    });

    set({ questions });
  }
}));