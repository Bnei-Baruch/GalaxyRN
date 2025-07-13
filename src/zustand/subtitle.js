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

let subLang = 'en';

export const useSubtitleStore = create((set, get) => ({
  isOpen: false,
  toggleIsOpen: isOpen => set(state => ({ isOpen: isOpen ?? !state.isOpen })),

  lastMsg: null,
  isConnected: false,

  init: async () => {
    await get().exit();

    const { audio } = useShidurStore.getState();

    subLang = audio.key?.split('_')[1];
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

  onMessage: async data => {
    logger.debug(NAMESPACE, `Message received:`, data);
    let msg = JSON.parse(data);
    logger.debug(NAMESPACE, `Parsed message:`, msg);

    if (
      msg.display_status === 'none' ||
      msg.slide === '' ||
      (!msg.visible && msg.type === 'questions')
    ) {
      set({ lastMsg: null });
      logger.debug(NAMESPACE, `Clearing message`);
      return;
    }

    logger.debug(NAMESPACE, `Setting lastMsg:`, msg);
    set({ lastMsg: msg });
  },
}));
