import { create } from "zustand";
import mqtt from "../shared/mqtt";
import { useShidurStore } from "./shidur";
import { SUBTITLES_TOPIC } from "@env";
import { audio_options2, subtitle_options } from "../shared/consts";
import { useSettingsStore } from "./settings";
import logger from "../services/logger";

const NAMESPACE = 'Subtitle';

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

    logger.debug(NAMESPACE, `Subtitle language: ${subLang}`);

    if (!subLang) {
      subLang = useSettingsStore.getState().uiLang;
    }

    logger.info(NAMESPACE, `Initializing with language: ${subLang}`);
    mqtt.join(`${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}`);
    mqtt.join(`${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`);
    logger.debug(NAMESPACE, 
      `Joined topics: ${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}, ${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`
    );
  },
  exit: () => {
    set({ lastMsg: null });
    logger.info(NAMESPACE, `Exiting and clearing messages`);
    mqtt.exit(`${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}`);
    mqtt.exit(`${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`);
    logger.debug(NAMESPACE, 
      `Left topics: ${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}, ${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`
    );
  },
  onMessage: async (data) => {
    logger.debug(NAMESPACE, `Message received:`, data);
    let msg = JSON.parse(data);
    logger.debug(NAMESPACE, `Parsed message:`, msg);

    if (!msg.visible) {
      logger.debug(NAMESPACE, `Message is not visible - ignored`);
      return;
    }
    msg.display_status = "subtitles";
    if (!msg || msg.display_status === MSGS_NONE.display_status || !msg.slide) {
      logger.debug(NAMESPACE, `Clearing message - null or none display status`);
      set({ lastMsg: null });
      return;
    }
    logger.debug(NAMESPACE, `Setting lastMsg:`, msg);
    set({ lastMsg: msg });
  },
}));
