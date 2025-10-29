import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';
import { sleep } from '../shared/tools';
import { useInRoomStore } from '../zustand/inRoom';
import { useInitsStore } from '../zustand/inits';
import { useSettingsStore } from '../zustand/settings';
import { CONNECTION } from './sentry/constants';
import {
  addSpan,
  finishSpan,
  finishTransaction,
  startTransaction,
} from './sentry/sentryHelper';

export const NET_INFO_STATE_CONNECTED = 'CONNECTED';
export const NET_INFO_STATE_DISCONNECTED = 'DISCONNECTED';

const NAMESPACE = 'ConnectionMonitor';
const MAX_CONNECTION_TIMEOUT = 20;

let netInfoUnsubscribe, listeners, timeout, currentState, disconnectedSeconds;
const waitConnectionListeners = [];

export const initConnectionMonitor = () => {
  prevState = null;
  listeners = {};
  netInfoUnsubscribe = null;
  timeout = null;
  disconnectedSeconds = 0;

  // Start CONNECTION transaction
  startTransaction(CONNECTION, 'Connection Monitor', 'connection');

  netInfoUnsubscribe = NetInfo.addEventListener(async state => {
    const networkStateSpan = addSpan(
      CONNECTION,
      'connectionMonitor.networkState',
      {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.details?.isInternetReachable,
      }
    );
    logger.debug(NAMESPACE, 'Network state:', state);

    if (!currentState) {
      currentState = state;
      logger.debug(NAMESPACE, 'First network state');
      finishSpan(networkStateSpan, 'ok');
      return;
    }

    if (!state.isConnected) {
      logger.debug(NAMESPACE, 'Network disconnected');
      currentState = state;
      finishSpan(networkStateSpan, 'ok');
      waitConnectionRestart();
      return;
    }
    const isSame = isSameNetwork(state);
    currentState = state || {};
    if (!isSame) {
      disconnectedSeconds = 0;
      logger.debug(NAMESPACE, 'Network state was changed');
      finishSpan(networkStateSpan, 'ok');
      waitConnectionRestart();
      return;
    }
    finishSpan(networkStateSpan, 'ok');
  });
};

const isSameNetwork = newState => {
  if (Platform.OS === 'android') {
    return isSameNetworkAndroid(newState);
  }
  return isSameNetworkIOS(newState);
};

const isSameNetworkAndroid = newState => {
  return currentState.details?.ipAddress === newState?.details?.ipAddress;
};

const isSameNetworkIOS = newState => {
  if (currentState.type !== newState.type) {
    return false;
  }
  return currentState.details?.ipAddress === newState?.details?.ipAddress;
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
    finishSpan(restartSpan, 'internal_error');
    return;
  }

  try {
    callListeners();
    finishSpan(restartSpan, 'ok');
  } catch (e) {
    logger.error(NAMESPACE, 'Error calling listeners', e);
    finishSpan(restartSpan, 'internal_error');
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
    finishSpan(span, 'net_error');
    await onNoNetwork();
    return false;
  }

  try {
    await monitorMqtt();
    logger.debug(NAMESPACE, 'monitorMqtt success');
  } catch (e) {
    logger.error(NAMESPACE, 'Error in monitorMqtt', e);
    finishSpan(span, 'mqtt_error');
    await onNoNetwork();
    return false;
  }

  disconnectedSeconds = 0;
  useSettingsStore.getState().setNetWIP(false);
  finishSpan(span, 'ok');
  return true;
};

const onNoNetwork = async () => {
  logger.debug(NAMESPACE, 'onNoNetwork');
  try {
    await useInRoomStore.getState().exitRoom();
  } catch (e) {
    logger.error(NAMESPACE, 'Error in exitRoom', e);
  }
  useInitsStore.getState().setMqttIsOn(false);
};

const monitorNetInfo = async () => {
  logger.debug(NAMESPACE, 'monitorNetInfo');
  BackgroundTimer.clearTimeout(timeout);

  disconnectedSeconds++;
  if (!currentState) {
    return false;
  }

  if (currentState.details?.isInternetReachable) {
    return true;
  }

  if (currentState.isConnected) {
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
  logger.debug(NAMESPACE, 'MQTT reconnect', mqtt.mq.reconnecting);
  if (!mqtt.mq.reconnecting) {
    logger.debug(NAMESPACE, 'mqtt reconnect triggered');
    mqtt.mq.reconnect();
  }
};

const callListeners = async () => {
  logger.debug(NAMESPACE, 'callListeners', Object.keys(listeners));
  for (const key in listeners) {
    try {
      logger.debug(NAMESPACE, 'calling listener', key);
      listeners[key]();
    } catch (error) {
      logger.error(NAMESPACE, 'Error in listener', key, error);
    }
    await sleep(100);
  }
};

export const waitConnection = async () => {
  logger.debug(NAMESPACE, 'waitConnection');

  if (
    currentState &&
    mqtt.mq?.connected &&
    (currentState.details?.isInternetReachable || currentState.isConnected)
  ) {
    return true;
  }

  logger.debug(NAMESPACE, 'waitConnection false', currentState, mqtt.mq);

  return new Promise(resolve => {
    logger.debug(
      NAMESPACE,
      'waitConnection push listener',
      currentState,
      mqtt.mq
    );
    waitConnectionListeners.push(connected => {
      logger.debug(NAMESPACE, 'waitConnection listener', connected);
      if (!connected) {
        logger.debug(NAMESPACE, 'waitConnection false', currentState, mqtt.mq);

        addSpan(CONNECTION, 'connectionMonitor.waitConnection', {
          isInternetReachable: currentState?.details?.isInternetReachable,
          isConnected: currentState?.isConnected,
          mqttConnected: mqtt.mq?.connected,
        }).finish('ok');
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
  listeners[key] = listener;
};

export const removeConnectionListener = key => {
  logger.debug(NAMESPACE, 'removeListener', key);
  if (listeners[key]) {
    delete listeners[key];
  }
};

export const clearWaitConnectionListeners = () => {
  logger.debug(NAMESPACE, 'clearWaitConnectionListeners');
  waitConnectionListeners.forEach(resolve => resolve(false));
  waitConnectionListeners.length = 0;
};

export const removeConnectionMonitor = () => {
  // Finish CONNECTION transaction
  finishTransaction(CONNECTION, 'ok');

  listeners = {};
  clearWaitConnectionListeners();
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
  BackgroundTimer.clearTimeout(timeout);
  timeout = null;
};

export const netIsConnected = () => {
  logger.debug(NAMESPACE, 'netIsConnected', currentState, mqtt.mq?.connected);

  return currentState?.isConnected && mqtt.mq?.connected;
};
