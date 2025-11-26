import NetInfo from '@react-native-community/netinfo';
import BackgroundTimer from 'react-native-background-timer';
import kc from '../auth/keycloak';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';
import { useInRoomStore } from '../zustand/inRoom';
import { useInitsStore } from '../zustand/inits';
import { useSettingsStore } from '../zustand/settings';
import { CONNECTION } from './sentry/constants';
import {
  addFinishSpan,
  addSpan,
  finishSpan,
  finishTransaction,
  startTransaction,
} from './sentry/sentryHelper';

export const NET_INFO_STATE_CONNECTED = 'CONNECTED';
export const NET_INFO_STATE_DISCONNECTED = 'DISCONNECTED';

const NAMESPACE = 'ConnectionMonitor';
const MAX_CONNECTION_TIMEOUT = 20;
const MAX_RECONNECT_DELAY = 5000;

let netInfoUnsubscribe,
  iceRestartListeners,
  timeout,
  currentState,
  disconnectedSeconds;
let lastReconnect = 0;
const waitConnectionListeners = [];

export const initConnectionMonitor = () => {
  logger.debug(NAMESPACE, 'initConnectionMonitor');
  iceRestartListeners = {};
  netInfoUnsubscribe = null;
  timeout = null;
  disconnectedSeconds = 0;
  lastReconnect = 0;

  startTransaction(CONNECTION, 'Connection Monitor', 'connection.monitor');

  netInfoUnsubscribe = NetInfo.addEventListener(async state => {
    const networkStateSpan = addSpan(
      CONNECTION,
      'connectionMonitor.networkState',
      {
        netConnected: isNetConnected(state),
        type: state.type,
      }
    );

    logger.debug(NAMESPACE, 'Network state:', state);

    if (!currentState) {
      currentState = state;
      logger.debug(NAMESPACE, 'First network state');
      useInitsStore.getState().setNetIsOn(isNetConnected(state));
      finishSpan(networkStateSpan, 'ok', NAMESPACE);
      return;
    }

    if (!isNetConnected(state)) {
      currentState = state;
      logger.debug(NAMESPACE, 'Network disconnected');
      await waitConnectionRestart();

      if (!isNetConnected()) {
        onNoNetwork();
        finishSpan(networkStateSpan, 'net_error', NAMESPACE);
      }
      finishSpan(networkStateSpan, 'ok', NAMESPACE);
      return;
    }

    const isSame = isSameNetwork(state);
    logger.debug(NAMESPACE, 'isSameNetwork', isSame);
    currentState = state;
    if (!isSame) {
      await waitConnectionRestart();

      if (!isNetConnected()) {
        onNoNetwork();
        finishSpan(networkStateSpan, 'net_error', NAMESPACE);
        return;
      }
    }

    logger.debug(NAMESPACE, 'Network connected', state, currentState);
    useInitsStore.getState().setMqttIsOn(mqtt.mq?.connected);
    disconnectedSeconds = 0;
    finishSpan(networkStateSpan, 'ok', NAMESPACE);
  });
};

const isSameNetwork = newState => {
  if (newState.isConnected !== currentState.isConnected) {
    return false;
  }

  if (currentState.type !== newState.type) {
    logger.debug(
      NAMESPACE,
      `Network type changed: ${currentState.type} -> ${newState.type}`
    );
    return false;
  }

  const currentIp = currentState.details?.ipAddress;
  const newIp = newState?.details?.ipAddress;

  if (!currentIp && !newIp) {
    logger.debug(NAMESPACE, 'Both states have no IP address');
    return true;
  }

  if (!currentIp || !newIp) {
    logger.debug(NAMESPACE, `IP address changed: ${!!currentIp} -> ${!!newIp}`);
    return false;
  }

  const currentIps = Array.isArray(currentIp) ? currentIp : [currentIp];
  const newIps = Array.isArray(newIp) ? newIp : [newIp];

  const hasCommonIp = currentIps.some(ip => newIps.includes(ip));

  logger.debug(NAMESPACE, `hasCommonIp: ${hasCommonIp}`);
  return hasCommonIp;
};

const waitConnectionRestart = async () => {
  const restartSpan = addSpan(
    CONNECTION,
    'connectionMonitor.waitConnectionRestart'
  );
  logger.debug(NAMESPACE, 'waitICERestart');
  const connected = await waitAndRestart();
  callWaitConnectionListeners(connected);
  if (!connected) {
    finishSpan(restartSpan, 'internal_error', NAMESPACE);
    return;
  }

  try {
    callListeners();
    finishSpan(restartSpan, 'ok', NAMESPACE);
  } catch (e) {
    logger.error(NAMESPACE, 'Error calling iceRestartListeners', e);
    finishSpan(restartSpan, 'internal_error', NAMESPACE);
    useInRoomStore.getState().restartRoom();
  }
};

const waitAndRestart = async () => {
  const span = addSpan(CONNECTION, 'connectionMonitor.waitAndRestart');
  logger.debug(NAMESPACE, 'waitAndRestart');
  useSettingsStore.getState().setNetWIP(true);

  try {
    await monitorNetInfo();
    logger.debug(NAMESPACE, 'monitorNetInfo success');
  } catch (e) {
    logger.error(NAMESPACE, 'Error in monitorNetInfo', e);
    finishSpan(span, 'net_error', NAMESPACE);
    await onNoNetwork();
    return false;
  }

  useInitsStore.getState().setNetIsOn(true);

  try {
    await monitorMqtt();
    logger.debug(NAMESPACE, 'monitorMqtt success');
  } catch (e) {
    logger.error(NAMESPACE, 'Error in monitorMqtt', e);
    finishSpan(span, 'mqtt_error', NAMESPACE);
    await onNoNetwork();
    return false;
  }

  disconnectedSeconds = 0;
  useSettingsStore.getState().setNetWIP(false);
  finishSpan(span, 'ok', NAMESPACE);
  return true;
};

const onNoNetwork = async () => {
  logger.debug(NAMESPACE, 'onNoNetwork');

  try {
    await useInRoomStore.getState().exitRoom();
  } catch (e) {
    logger.error(NAMESPACE, 'Error in exitRoom', e);
  }

  const _netIsOn = isNetConnected();
  useInitsStore.getState().setMqttIsOn(false);
  useSettingsStore.getState().setNetWIP(false);
  useInitsStore.getState().setNetIsOn(_netIsOn);

  try {
    kc.logout();
  } catch (e) {
    logger.debug(NAMESPACE, 'Error in logout', e);
  }
};

const monitorNetInfo = async () => {
  logger.debug(NAMESPACE, 'monitorNetInfo');
  BackgroundTimer.clearTimeout(timeout);

  disconnectedSeconds++;

  if (isNetConnected()) {
    return true;
  }

  logger.debug(NAMESPACE, 'monitorNetInfo run timeout', disconnectedSeconds);
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
  logger.debug(NAMESPACE, 'monitorMqtt');
  BackgroundTimer.clearTimeout(timeout);
  if (!mqtt.mq) {
    return false;
  }

  if (disconnectedSeconds > MAX_CONNECTION_TIMEOUT) {
    throw new Error('MQTT disconnected');
  }

  disconnectedSeconds++;
  logger.debug(NAMESPACE, 'MQTT connected', mqtt.mq?.connected);
  if (mqtt.mq?.connected) {
    return;
  }
  logger.debug(NAMESPACE, 'monitorMqtt run timeout', disconnectedSeconds);
  return new Promise(resolve => {
    timeout = BackgroundTimer.setTimeout(() => {
      if (mqtt.mq?.connected) {
        return resolve(true);
      }
      mqttReconnect()
        .catch(e => {
          logger.error(NAMESPACE, 'mqtt reconnect error', e);
        })
        .then(() => {
          logger.debug(NAMESPACE, 'mqtt reconnect done', disconnectedSeconds);
        })
        .finally(() => {
          resolve(monitorMqtt());
        });
    }, 1000);
  });
};

const mqttReconnect = async () => {
  const now = Date.now();
  if (mqtt.mq?.connected) {
    logger.debug(NAMESPACE, 'mqtt already connected, skipping reconnect');
    return true;
  }

  if (mqtt.mq.reconnecting) {
    logger.debug(NAMESPACE, 'mqtt reconnect already in progress, skipping');
    return;
  }

  if (now - lastReconnect < MAX_RECONNECT_DELAY) {
    logger.debug(NAMESPACE, 'mqtt reconnect too soon, skipping');
    return;
  }

  lastReconnect = now;
  logger.debug(NAMESPACE, 'mqtt reconnect triggered');

  try {
    mqtt.mq.reconnect();
  } catch (e) {
    logger.error(NAMESPACE, 'mqtt reconnect error', e);
    throw e;
  }
};

export const resetLastReconnect = () => {
  logger.debug(NAMESPACE, 'resetLastReconnect');
  lastReconnect = 0;
};

const callListeners = async () => {
  logger.debug(NAMESPACE, 'callListeners', Object.keys(iceRestartListeners));
  for (const key in iceRestartListeners) {
    try {
      logger.debug(NAMESPACE, 'calling listener', key);
      iceRestartListeners[key]();
    } catch (error) {
      logger.error(NAMESPACE, 'Error in listener', key, error);
    }
  }
};

export const waitConnection = async () => {
  logger.debug(NAMESPACE, 'waitConnection');

  if (isNetConnected() && mqtt.mq?.connected) {
    return true;
  }

  return new Promise(resolve => {
    waitConnectionListeners.push(connected => {
      logger.debug(NAMESPACE, 'waitConnection listener', connected);
      if (!connected) {
        const netConnected = isNetConnected();
        logger.debug(NAMESPACE, 'called waitConnection: ', netConnected);

        addFinishSpan(CONNECTION, 'connectionMonitor.waitConnection', {
          netConnected,
          mqttConnected: mqtt.mq?.connected,
          NAMESPACE,
        });
      }
      resolve(connected);
    });
  });
};

const callWaitConnectionListeners = connected => {
  logger.debug(NAMESPACE, 'callWaitConnectionListeners', connected);

  if (!connected) {
    clearWaitConnectionListeners();
    return;
  }

  if (disconnectedSeconds < 10) {
    waitConnectionListeners.forEach(listener => listener(true));
  } else {
    waitConnectionListeners.forEach(listener => listener(false));
  }
  waitConnectionListeners.length = 0;
};

export const addConnectionListener = (key, listener) => {
  logger.debug(NAMESPACE, 'addListener', key);
  iceRestartListeners[key] = listener;
};

export const removeConnectionListener = key => {
  logger.debug(NAMESPACE, 'removeListener', key);
  if (iceRestartListeners[key]) {
    delete iceRestartListeners[key];
  }
};

export const clearWaitConnectionListeners = () => {
  logger.debug(NAMESPACE, 'clearWaitConnectionListeners');
  waitConnectionListeners.forEach(resolve => resolve(false));
  waitConnectionListeners.length = 0;
};

export const removeConnectionMonitor = () => {
  finishTransaction(CONNECTION, 'ok', NAMESPACE);

  iceRestartListeners = {};
  clearWaitConnectionListeners();
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
  BackgroundTimer.clearTimeout(timeout);
  timeout = null;
};

const isNetConnected = (state = currentState) => {
  if (!state) {
    return false;
  }

  return state.isConnected;
};
