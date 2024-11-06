import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { setToStorage, getFromStorage } from '../shared/tools';

export const UI_LANGUAGES = ['en', 'es', 'he', 'ru'];

export const DEFAULT_LANGUAGE = 'en';

export const setLanguage = (value) => {
  i18n.changeLanguage(value);
  setToStorage('lng', value);
};

const languageDetector = {
  type  : 'languageDetector',
  async : true,
  detect: async (callback) => {
    const lng = await getFromStorage('lng', DEFAULT_LANGUAGE);
    callback(lng);
  }
};

// instance for client side
i18n
  .use(initReactI18next)
  .use(languageDetector)
  .init({
    resources: {
      'en': { common: require('./en.json') },
      'he': { common: require('./he.json') },
      'es': { common: require('./es.json') },
      'ru': { common: require('./ru.json') },
    },

    languages  : UI_LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    ns         : ['common'],
    defaultNS  : 'common',

    debug        : false,
    interpolation: { escapeValue: false },
    react        : { useSuspense: false },
  });