import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import logger from '../services/logger';
import { getFromStorage, setToStorage } from '../shared/tools';

const NAMESPACE = 'i18n';

export const UI_LANGUAGES = ['en', 'es', 'he', 'ru'];

export const DEFAULT_LANGUAGE = 'en';

export const setLanguage = value => {
  i18n.changeLanguage(value);
  setToStorage('lng', value);
};

export const getSystemLanguage = () => {
  try {
    const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale;

    const languageCode = systemLocale.split('-')[0];

    return languageCode;
  } catch (error) {
    console.warn('Could not detect system language:', error);
    return DEFAULT_LANGUAGE;
  }
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async callback => {
    const storedLang = await getFromStorage('lng');
    logger.debug(NAMESPACE, `Stored language: ${storedLang}`);
    if (storedLang) {
      callback(storedLang);
      return;
    }

    const systemLang = getSystemLanguage();
    if (UI_LANGUAGES.includes(systemLang)) {
      logger.debug(NAMESPACE, `System language: ${systemLang}`);
      callback(systemLang);
    } else {
      callback(DEFAULT_LANGUAGE);
    }
  },
};

// instance for client side
i18n
  .use(initReactI18next)
  .use(languageDetector)
  .init({
    resources: {
      en: { common: require('./en.json') },
      he: { common: require('./he.json') },
      es: { common: require('./es.json') },
      ru: { common: require('./ru.json') },
    },

    languages: UI_LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    ns: ['common'],
    defaultNS: 'common',

    debug: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
