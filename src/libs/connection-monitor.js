import NetInfo from '@react-native-community/netinfo';
import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';
import { useInRoomStore } from '../zustand/inRoom';
import { useSettingsStore } from '../zustand/settings';

export const NET_INFO_STATE_CONNECTED = 'CONNECTED';
export const NET_INFO_STATE_DISCONNECTED = 'DISCONNECTED';

const NAMESPACE = 'ConnectionMonitor';
const MAX_CONNECTION_TIMEOUT = 20;

let netInfoUnsubscribe,
  prevIp,
  listeners,
  timeout,
  currentState,
  disconnectedSeconds;

export const initConnectionMonitor = () => {
  prevIp = null;
  listeners = {};
  netInfoUnsubscribe = null;
  timeout = null;
  disconnectedSeconds = 0;

  netInfoUnsubscribe = NetInfo.addEventListener(async state => {
    logger.debug(NAMESPACE, 'Network state:', state);
    const prevState = currentState;

    if (!state.isConnected) {
      logger.debug(NAMESPACE, 'Network disconnected');
      currentState = NET_INFO_STATE_DISCONNECTED;
      runMonitor();
      return;
    }

    currentState = NET_INFO_STATE_CONNECTED;
    const newIp = state.details?.ipAddress;

    if (!prevIp || (prevState === currentState && newIp === prevIp)) {
      logger.debug(NAMESPACE, 'Network state not changed');
      prevIp = newIp;
      return;
    }

    runMonitor();
    prevIp = newIp;
  });
};

export const runMonitor = async () => {
  logger.debug(NAMESPACE, 'runMonitor', currentState);
  useSettingsStore.getState().setNetWIP(true);
  try {
    await monitorNetInfo();
  } catch (e) {
    useSettingsStore.getState().setNetWIP(false);
    useInRoomStore.getState().restartRoom();
    return;
  }
  logger.debug(NAMESPACE, 'monitorNetInfo success');

  try {
    await monitorMqtt();
  } catch (e) {
    useSettingsStore.getState().setNetWIP(false);
    useInRoomStore.getState().restartRoom();
    return;
  }
  logger.debug(NAMESPACE, 'monitorMqtt success');

  try {
    callListeners();
  } catch (e) {
    logger.error(NAMESPACE, 'Error calling listeners', e);
    useInRoomStore.getState().restartRoom();
  }
  disconnectedSeconds = 0;
  useSettingsStore.getState().setNetWIP(false);
};

const monitorNetInfo = async () => {
  logger.debug(NAMESPACE, 'monitorNetInfo', currentState);
  BackgroundTimer.clearTimeout(timeout);

  disconnectedSeconds++;
  if (currentState !== NET_INFO_STATE_DISCONNECTED) {
    return;
  }
  if (disconnectedSeconds > MAX_CONNECTION_TIMEOUT) {
    throw new Error('Network disconnected');
  }
  return new Promise(resolve => {
    timeout = BackgroundTimer.setTimeout(() => {
      logger.debug(NAMESPACE, 'monitorNetInfo timeout');
      resolve(monitorNetInfo());
    }, 1000);
  });
};

const monitorMqtt = async () => {
  logger.debug(NAMESPACE, 'monitorMqtt', currentState);
  BackgroundTimer.clearTimeout(timeout);

  if (disconnectedSeconds > MAX_CONNECTION_TIMEOUT) {
    throw new Error('MQTT disconnected');
  }

  disconnectedSeconds++;
  logger.debug(NAMESPACE, 'MQTT connected', mqtt.mq.connected);
  if (mqtt.mq.connected) {
    return;
  }
  return new Promise(resolve => {
    timeout = BackgroundTimer.setTimeout(() => {
      logger.debug(NAMESPACE, 'monitorMqtt timeout');
      try {
        //mqtt.mq.reconnect();
        logger.debug(NAMESPACE, 'mqtt reconnect triggered');
      } catch (e) {
        logger.error(NAMESPACE, 'mqtt reconnect error', e);
      } finally {
        resolve(monitorMqtt());
      }
    }, 1000);
  });
};

const callListeners = () => {
  logger.debug(NAMESPACE, 'callListeners', Object.keys(listeners));
  for (const key in listeners) {
    listeners[key]();
  }
};

export const addConnectionListener = (key, listener) => {
  logger.debug(NAMESPACE, 'addListener', key);
  listeners[key] = listener;
};

export const removeConnectionListener = key => {
  logger.debug(NAMESPACE, 'removeListener', key);
  if (listeners[key]) {
    delete listeners[key];
  }
};

export const removeConnectionMonitor = () => {
  listeners = {};
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
  BackgroundTimer.clearTimeout(timeout);
  timeout = null;
};

export const netIsConnected = () => {
  logger.debug(NAMESPACE, 'netIsConnected', currentState, mqtt.mq.connected);
  return currentState === NET_INFO_STATE_CONNECTED && mqtt.mq.connected;
};
