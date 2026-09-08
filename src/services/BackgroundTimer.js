import { NativeEventEmitter, Platform } from 'react-native';
import logger from './logger';
import NativeBackgroundTimerModule from '../specs/NativeBackgroundTimerModule';
import NativeBackgroundTimer from '../specs/NativeBackgroundTimer';

const NAMESPACE = 'BackgroundTimer';

let NativeTimer = null;
if (Platform.OS === 'android') {
  NativeTimer = NativeBackgroundTimerModule;
} else if (Platform.OS === 'ios') {
  NativeTimer = NativeBackgroundTimer;
}

class BackgroundTimerFacade {
  uniqueId = 0;
  callbacks = {};

  constructor() {
    logger.debug(NAMESPACE, 'constructor', 'platform:', Platform.OS, 'NativeTimer available:', !!NativeTimer);
    if (!NativeTimer) {
      logger.warn(NAMESPACE, 'native module is not available');
      return;
    }
    if (Platform.OS === 'ios') {
      new NativeEventEmitter(NativeTimer).addListener('timeout', this._onTimeout);
      logger.debug(NAMESPACE, 'registered iOS NativeEventEmitter timeout listener');
    } else if (Platform.OS === 'android') {
      NativeTimer.timeout(this._onTimeout);
      logger.debug(NAMESPACE, 'registered Android timeout EventEmitter listener');
    }
  }

  // id/interval bookkeeping mirrors react-native-background-timer's JS wrapper:
  // native only ever fires a one-shot timeout, so intervals are re-armed here on each fire.
  _onTimeout = id => {
    logger.debug(NAMESPACE, '_onTimeout fired', 'id:', id);

    const entry = this.callbacks[id];
    if (!entry) {
      logger.warn(NAMESPACE, '_onTimeout: no entry for id', id, '- late/stale native fire or lost callback');
      logger.debug(NAMESPACE, '_onTimeout: current callbacks', this.callbacks);
      return;
    }
    if (!entry.interval) {
      logger.debug(NAMESPACE, '_onTimeout: clearing one-shot timeout', 'id:', id);
      this.clearTimeout(id);
      logger.debug(NAMESPACE, '_onTimeout: invoking callback', 'id:', id);
      try {
        entry.callback();
      } catch (e) {
        logger.error(NAMESPACE, '_onTimeout: callback threw', 'id:', id, e);
      }
      return;
    }
    logger.debug(NAMESPACE, '_onTimeout: invoking callback', 'id:', id);
    try {
      entry.callback();
    } catch (e) {
      // A throwing callback must not prevent re-arming below - otherwise this
      // interval silently stops forever (e.g. mqtt's KeepaliveManager, whose
      // recurring tick would then never fire again for the life of the app).
      logger.error(NAMESPACE, '_onTimeout: interval callback threw', 'id:', id, e);
    }
    // Re-arm only if the callback didn't clear this interval on itself
    // synchronously (e.g. mqtt's KeepaliveManager clearing on timeout) —
    // otherwise the native timer would fire again with no entry to match.
    if (this.callbacks[id] === entry) {
      logger.debug(NAMESPACE, '_onTimeout: re-arming interval', 'id:', id, 'timeoutMs:', entry.timeoutMs);
      NativeTimer.setTimeout(id, entry.timeoutMs);
    }
  };

  setTimeout = (callback, timeoutMs) => {
    this.uniqueId += 1;
    const id = this.uniqueId;
    this.callbacks[id] = { callback, interval: false, timeoutMs };
    logger.debug(NAMESPACE, 'setTimeout', 'id:', id, 'callback:', callback, 'timeoutMs:', timeoutMs, 'nativeAvailable:', !!NativeTimer);
    NativeTimer?.setTimeout(id, timeoutMs);
    return id;
  };

  clearTimeout = id => {
    logger.debug(NAMESPACE, 'clearTimeout', 'id:', id, 'existed:', !!this.callbacks[id]);
    delete this.callbacks[id];
    if (id == null) {
      logger.debug(NAMESPACE, 'clearTimeout: id is null/undefined, skipping native call');
      return;
    }
    NativeTimer?.clearTimeout(id);
  };

  setInterval = (callback, timeoutMs) => {
    this.uniqueId += 1;
    const id = this.uniqueId;
    this.callbacks[id] = { callback, interval: true, timeoutMs };
    logger.debug(NAMESPACE, 'setInterval', 'id:', id, 'timeoutMs:', timeoutMs, 'nativeAvailable:', !!NativeTimer);
    NativeTimer?.setTimeout(id, timeoutMs);
    return id;
  };

  clearInterval = id => {
    logger.debug(NAMESPACE, 'clearInterval', 'id:', id, 'existed:', !!this.callbacks[id]);
    this.clearTimeout(id);
  };

  start = () => {
    logger.debug(NAMESPACE, 'start', 'platform:', Platform.OS);
    if (Platform.OS === 'android') {
      NativeTimer?.start();
    }
  };

  stop = () => {
    logger.debug(NAMESPACE, 'stop', 'platform:', Platform.OS);
    if (Platform.OS === 'android') {
      NativeTimer?.stop();
    }
  };
}

const backgroundTimerDefault = new BackgroundTimerFacade();

export default backgroundTimerDefault;
