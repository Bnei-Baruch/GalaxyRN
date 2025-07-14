// External libraries
import { create } from 'zustand';

// Environment variables
import { SUBTITLES_TOPIC } from '@env';

// Shared modules
import { subtitle_options } from '../shared/consts';

// Services
import logger from '../services/logger';
import { useShidurStore } from './shidur';

// Zustand stores
import i18n from '../i18n/i18n';
import mqtt from '../shared/mqtt';

const NAMESPACE = 'Subtitle';

export const MSGS_QUESTION = {
  type: 'question',
  display_status: 'questions',
  topic: 'question',
};
export const MSGS_SUBTITLE = {
  type: 'subtitle',
  display_status: 'subtitles',
  topic: 'slide',
};
export const MSGS_NONE = { type: 'none', display_status: 'none' };
export const MSGS_ALL = [MSGS_QUESTION, MSGS_SUBTITLE, MSGS_NONE];

const ORIGINAL_LANG = 'he';
let subLang = ORIGINAL_LANG;

export const useSubtitleStore = create((set, get) => ({
  isOpen: false,
  toggleIsOpen: isOpen => set(state => ({ isOpen: isOpen ?? !state.isOpen })),

  lastMsg: null,
  isConnected: false,

  init: async () => {
    await get().exit();

    const { audio } = useShidurStore.getState();

    subLang = audio.key?.split('_')[1];
    if (subLang === 'original') {
      subLang = ORIGINAL_LANG;
    }
    if (!subtitle_options.some(op => op.value === subLang)) {
      subLang = i18n.language;
    }

    logger.info(NAMESPACE, `Initializing with language: ${subLang}`);
    try {
      mqtt.join(`${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}`);
      mqtt.join(`${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`);
    } catch (e) {
      logger.error(NAMESPACE, `Error joining topics:`, e);
    }

    logger.debug(NAMESPACE, `Joined topics: ${subLang}`);
    set({ isConnected: true });
  },

  exit: async () => {
    if (!get().isConnected) return;

    logger.info(NAMESPACE, `Exiting and clearing messages`);
    try {
      await mqtt.exit(`${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}`);
      await mqtt.exit(`${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`);
    } catch (e) {
      logger.error(NAMESPACE, `Error exiting topics:`, e);
    }
    logger.debug(NAMESPACE, `Left topics: ${subLang}`);
    set({ lastMsg: null, isConnected: false });
  },

  onMessage: async (data, topic) => {
    logger.debug(NAMESPACE, `Message received:`, data, topic);
    let msg = JSON.parse(data);
    logger.debug(NAMESPACE, `Parsed message:`, msg);

    const infoByType = MSGS_ALL.find(m => m.type === msg.type);
    if (msg.type !== MSGS_NONE.type && infoByType?.topic !== topic) {
      logger.debug(
        NAMESPACE,
        `Message type mismatch: ${msg.type} ${infoByType?.topic} ${topic}`
      );
      return;
    }

    if (
      msg.display_status === MSGS_NONE.display_status ||
      msg.slide === '' ||
      msg.display_status !== infoByType?.display_status ||
      (!msg.visible && msg.type === MSGS_QUESTION.type)
    ) {
      set({ lastMsg: null });
      logger.debug(NAMESPACE, `Clearing message`);
      return;
    }

    logger.debug(NAMESPACE, `Setting lastMsg:`, msg);
    set({ lastMsg: msg });
  },
}));
