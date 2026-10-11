import { create } from 'zustand';
import { STORAGE_KEYS } from '../constants';
import { setVerboseUntil } from '../services/logFile';
import logger from '../services/logger';
import { getFromStorage, setToStorage } from '../tools';

const NAMESPACE = 'VerboseLogging';

// Full (verbose) logging is CPU-expensive, so it is only ever on for a limited
// time: it switches itself off after TTL, on logout and on app update.
export const VERBOSE_LOGGING_TTL_MS = 3 * 60 * 60 * 1000;

const APP_VERSION: string = require('../../package.json').version;

type Persisted = { until: number; version: string };

interface VerboseLoggingState {
  // epoch ms; 0 = off
  until: number;
  enable: () => void;
  disable: () => void;
  restore: () => Promise<void>;
}

let expiryTimer: ReturnType<typeof setTimeout> | null = null;

const persist = (until: number) => {
  const value: Persisted = { until, version: APP_VERSION };
  setToStorage(STORAGE_KEYS.VERBOSE_LOGGING, JSON.stringify(value));
};

export const useVerboseLoggingStore = create<VerboseLoggingState>(
  (set, get) => {
    const apply = (until: number) => {
      if (expiryTimer) {
        clearTimeout(expiryTimer);
        expiryTimer = null;
      }
      setVerboseUntil(until);
      set({ until });

      // The logger checks the deadline itself on every call; this timer only
      // resets UI state. Throttled in background — fine, it fires on resume.
      if (until) {
        expiryTimer = setTimeout(
          () => get().disable(),
          Math.max(until - Date.now(), 0)
        );
      }
    };

    return {
      until: 0,

      enable: () => {
        const until = Date.now() + VERBOSE_LOGGING_TTL_MS;
        apply(until);
        persist(until);
        logger.info(
          NAMESPACE,
          'Verbose logging enabled until',
          new Date(until).toISOString()
        );
      },

      disable: () => {
        if (!get().until) return;
        logger.info(NAMESPACE, 'Verbose logging disabled');
        apply(0);
        persist(0);
      },

      restore: async () => {
        const raw = await getFromStorage(STORAGE_KEYS.VERBOSE_LOGGING, null);
        if (!raw) return;

        let saved: Persisted | null = null;
        try {
          saved = JSON.parse(raw);
        } catch {
          saved = null;
        }

        if (!saved?.until) return;

        if (saved.version !== APP_VERSION || saved.until <= Date.now()) {
          persist(0);
          return;
        }

        apply(saved.until);
        logger.info(
          NAMESPACE,
          'Verbose logging restored until',
          new Date(saved.until).toISOString()
        );
      },
    };
  }
);
