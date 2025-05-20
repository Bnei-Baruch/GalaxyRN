import { create } from "zustand";
import mqtt from "../shared/mqtt";
import { useUserStore } from "./user";
const { SUBTITLES_TOPIC } = "@env";

export const MSGS_QUESTION = {
  type: "question",
  display_status: "questions",
  topic: "question",
};
export const MSGS_SUBTITLE = {
  type: "subtitle",
  display_status: "subtitles",
  topic: "slide",
};
export const MSGS_NONE = { type: "none", display_status: "none" };
export const MSGS_ALL = [MSGS_QUESTION, MSGS_SUBTITLE, MSGS_NONE];

export const useSubtitleStore = create((set, get) => ({
  isOpen: false,
  toggleIsOpen: (isOpen) =>
    set((state) => ({ isOpen: isOpen ?? !state.isOpen })),
  lastMsg: null,
  init: () => {
    const { language } = useUserStore.getState();
    console.log(`[Subtitle] Initializing with language: ${language}`);
    mqtt.join(`${SUBTITLES_TOPIC}${language}/${MSGS_SUBTITLE.topic}`);
    mqtt.join(`${SUBTITLES_TOPIC}${language}/${MSGS_QUESTION.topic}`);
    console.log(`[Subtitle] Joined topics: ${SUBTITLES_TOPIC}${language}/${MSGS_SUBTITLE.topic}, ${SUBTITLES_TOPIC}${language}/${MSGS_QUESTION.topic}`);
  },
  exit: () => {
    set({ lastMsg: null });
    const { language } = useUserStore.getState();
    console.log(`[Subtitle] Exiting and clearing messages`);
    mqtt.exit(`${SUBTITLES_TOPIC}${language}/${MSGS_SUBTITLE.topic}`);
    mqtt.exit(`${SUBTITLES_TOPIC}${language}/${MSGS_QUESTION.topic}`);
    console.log(`[Subtitle] Left topics: ${SUBTITLES_TOPIC}${language}/${MSGS_SUBTITLE.topic}, ${SUBTITLES_TOPIC}${language}/${MSGS_QUESTION.topic}`);
  },
  onMessage: async (data) => {
    console.log(`[Subtitle] Message received:`, data);
    let msg = JSON.parse(data);
    console.log(`[Subtitle] Parsed message:`, msg);

    const infoByType = MSGS_ALL.find((m) => m.type === msg.type);
    // Extract topic from the MQTT message or default to current topic
    const currentTopic = msg.topic || (infoByType?.topic || "");
    
    if (msg.type !== MSGS_NONE.type && infoByType?.topic !== currentTopic) {
      console.log(`[Subtitle] Message ignored - type or topic mismatch`);
      return;
    }

    if (!msg || msg.display_status === MSGS_NONE.display_status) {
      console.log(`[Subtitle] Clearing message - null or none display status`);
      set({ lastMsg: null });
      return;
    }
    console.log(`[Subtitle] Setting lastMsg:`, msg);
    set({ lastMsg: msg });
  },
}));
