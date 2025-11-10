import { SUBTITLES_TOPIC } from '@env';
import { create } from 'zustand';
import i18n from '../i18n/i18n';
import logger from '../services/logger';
import { subtitle_options } from '../shared/consts';
import mqtt from '../shared/mqtt';
import { rejectTimeoutPromise } from '../shared/tools';
import { useShidurStore } from './shidur';

const NAMESPACE = 'Subtitle';

export const MSGS_QUESTION = {
  slide_type: 'question',
  display_status: 'questions',
  topic: 'question',
};
export const MSGS_SUBTITLE = {
  slide_type: 'subtitle',
  display_status: 'subtitles',
  topic: 'slide',
};
export const MSGS_NONE = { slide_type: 'none', display_status: 'none' };
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
      await Promise.all([
        mqtt.sub(`${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}`),
        mqtt.sub(`${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`),
      ]);
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
      await rejectTimeoutPromise(
        Promise.all([
          mqtt.exit(`${SUBTITLES_TOPIC}${subLang}/${MSGS_SUBTITLE.topic}`),
          mqtt.exit(`${SUBTITLES_TOPIC}${subLang}/${MSGS_QUESTION.topic}`),
        ]),
        2000
      );
    } catch (e) {
      logger.error(NAMESPACE, `Error exiting topics:`, e);
    }
    logger.debug(NAMESPACE, `Left topics: ${subLang}`);
    set({ lastMsg: null, isConnected: false });
  },

  onMessage: async data => {
    let msg = JSON.parse(data);
    logger.debug(NAMESPACE, `Parsed message:`, msg);

    if (msg.display_status === MSGS_NONE.display_status) {
      set({ lastMsg: null });
      logger.debug(NAMESPACE, `Clearing message`);
      return;
    }

    const infoByType = MSGS_ALL.find(m => m.slide_type === msg.slide_type);
    if (infoByType?.display_status !== msg.display_status) {
      logger.debug(NAMESPACE, `Ignoring message`);
      return;
    }

    if (
      msg.slide === '' ||
      (!msg.visible && msg.slide_type === MSGS_QUESTION.slide_type)
    ) {
      set({ lastMsg: null });
      logger.debug(NAMESPACE, `Clearing message`);
      return;
    }

    logger.debug(NAMESPACE, `Setting lastMsg:`, msg);
    set({ lastMsg: msg });
  },
}));
