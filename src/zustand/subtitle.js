import { create } from "zustand";
import mqtt from "../shared/mqtt";
import { useShidurStore } from "./shidur";
import { SUBTITLES_TOPIC } from "@env";
import { audio_options2, subtitle_options } from "../shared/consts";
import { useSettingsStore } from "./settings";

const MSGS_QUESTION = {
  type: "question",
  display_status: "questions",
  topic: "question",
};
const MSGS_SUBTITLE = {
  type: "subtitle",
  display_status: "subtitles",
  topic: "slide",
};
export const MSGS_NONE = { type: "none", display_status: "none" };
export const MSGS_ALL = [MSGS_QUESTION, MSGS_SUBTITLE, MSGS_NONE];

let subLang = "en";

export const useSubtitleStore = create((set, get) => ({
  isOpen: false,
  toggleIsOpen: (isOpen) =>
    set((state) => ({ isOpen: isOpen ?? !state.isOpen })),
  lastMsg: null,
  init: (audio) => {
    let subLang = audio_options2
      .filter((op) => op.value === audio)
      .map((op) => {
        const k = op.langKey ?? op.key;
        const subOp = subtitle_options.find((sOp) => k === sOp.value);
        return subOp?.value;
      })[0];

    console.log(`[Subtitle] Subtitle language: ${subLang}`);

    if (!subLang) {
      subLang = useSettingsStore.getState().uiLang;
    }

    console.log(`[Subtitle] Initializing with language: ${subLang}`);
    mqtt.join(`${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}`);
    mqtt.join(`${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`);
    console.log(
      `[Subtitle] Joined topics: ${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}, ${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`
    );
  },
  exit: () => {
    set({ lastMsg: null });
    console.log(`[Subtitle] Exiting and clearing messages`);
    mqtt.exit(`${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}`);
    mqtt.exit(`${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`);
    console.log(
      `[Subtitle] Left topics: ${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}, ${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`
    );
  },
  onMessage: async (data) => {
    console.log(`[Subtitle] Message received:`, data);
    let msg = JSON.parse(data);
    console.log(`[Subtitle] Parsed message:`, msg);

    if (!msg.visible) {
      console.log(`[Subtitle] Message is not visible - ignored`);
      return;
    }
    msg.display_status = "subtitles";
    if (!msg || msg.display_status === MSGS_NONE.display_status || !msg.slide) {
      console.log(`[Subtitle] Clearing message - null or none display status`);
      set({ lastMsg: null });
      return;
    }
    console.log(`[Subtitle] Setting lastMsg:`, msg);
    set({ lastMsg: msg });
  },
}));
