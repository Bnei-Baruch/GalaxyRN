import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';
import { sleep } from '../shared/tools';
import { useInRoomStore } from '../zustand/inRoom';
import { useInitsStore } from '../zustand/inits';
import { useSettingsStore } from '../zustand/settings';

export const NET_INFO_STATE_CONNECTED = 'CONNECTED';
export const NET_INFO_STATE_DISCONNECTED = 'DISCONNECTED';

const NAMESPACE = 'ConnectionMonitor';
const MAX_CONNECTION_TIMEOUT = 20;

let netInfoUnsubscribe, listeners, timeout, currentState, disconnectedSeconds;

export const initConnectionMonitor = () => {
  prevState = null;
  listeners = {};
  netInfoUnsubscribe = null;
  timeout = null;
  disconnectedSeconds = 0;

  netInfoUnsubscribe = NetInfo.addEventListener(async state => {
    logger.debug(NAMESPACE, 'Network state:', state);

    if (!currentState) {
      currentState = state;
      logger.debug(NAMESPACE, 'First network state');
      return;
    }

    if (!state.isConnected) {
      logger.debug(NAMESPACE, 'Network disconnected');
      currentState = state;
      waitICERestart();
      return;
    }
    const isSame = isSameNetwork(state);
    currentState = state || {};
    if (!isSame) {
      disconnectedSeconds = 0;
      logger.debug(NAMESPACE, 'Network state was changed');
      waitICERestart();
    }
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

export const waitICERestart = async () => {
  logger.debug(NAMESPACE, 'waitICERestart');
  const connected = await waitConnection();
  if (!connected) {
    return;
  }

  try {
    callListeners();
  } catch (e) {
    logger.error(NAMESPACE, 'Error calling listeners', e);
    useInRoomStore.getState().restartRoom();
  }
};

export const waitConnection = async () => {
  logger.debug(NAMESPACE, 'waitConnection');
  useSettingsStore.getState().setNetWIP(true);
  try {
    await monitorNetInfo();
  } catch (e) {
    logger.error(NAMESPACE, 'Error in monitorNetInfo', e);
    await onNoNetwork();
    return false;
  }
  logger.debug(NAMESPACE, 'monitorNetInfo success');

  try {
    await monitorMqtt();
  } catch (e) {
    logger.error(NAMESPACE, 'Error in monitorMqtt', e);
    await onNoNetwork();
    return false;
  }
  logger.debug(NAMESPACE, 'monitorMqtt success');

  disconnectedSeconds = 0;
  useSettingsStore.getState().setNetWIP(false);
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

const callListeners = async () => {
  logger.debug(NAMESPACE, 'callListeners', Object.keys(listeners));
  for (const key in listeners) {
    try {
      logger.debug(NAMESPACE, 'calling listener', key);
      listeners[key]();
    } catch (error) {
      logger.error(NAMESPACE, 'Error in listener', key, error);
    }
    await sleep(1000);
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
  logger.debug(NAMESPACE, 'netIsConnected', currentState, mqtt.mq?.connected);

  return currentState?.isConnected && mqtt.mq?.connected;
};
