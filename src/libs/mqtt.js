import mqtt from 'mqtt';
import BackgroundTimer from '../services/BackgroundTimer';
import { getEnvValue } from '../services/env';
import logger from '../services/logger';

import { useChatStore } from '../zustand/chat';

import { randomString, rejectTimeoutPromise } from '../tools';
import { useInRoomStore } from '../zustand/inRoom';
import { useInitsStore } from '../zustand/inits';
import { useFeedsStore } from '../zustand/feeds';
import { useMyStreamStore } from '../zustand/myStream';
import { useSettingsStore } from '../zustand/settings';
import { useShidurStore } from '../zustand/shidur';
import { useSubtitleStore } from '../zustand/subtitle';
import { useUserStore } from '../zustand/user';
import { useVersionStore } from '../zustand/version';
import { waitConnection } from './connection-monitor';
import { CONNECTION } from './sentry/constants';
import { addFinishSpan, addSpan, finishSpan } from './sentry/sentryHelper';

import { Buffer } from 'buffer';
import kc from '../auth/keycloak';

const mqttTimeout = 5 * 60;
const mqttKeepalive = 15;
const MAX_RECONNECT_ATTEMPTS = 20;

const NAMESPACE = 'Mqtt';

const CLIENT_RECONNECT_TYPES = [
  'client-reconnect',
  'client-reload',
  'client-disconnect',
];

class MqttMsg {
  constructor() {
    this.user = null;
    this.mq = null;
    this.mit = null;
    this.room = null;
    this.initialized = false;
    this.wasConnected = false;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.clientId = null;
  }

  init = async () => {
    const initSpan = addSpan(CONNECTION, 'mqtt.init', { NAMESPACE });

    if (this.mq) {
      finishSpan(initSpan, 'error_already_initialized', NAMESPACE);
      return this.mq;
    }

    this.initialized = true;

    const { user } = useUserStore.getState();
    if (!this.clientId) {
      this.clientId = user.id + '-' + randomString(3);
    }
    const id = this.clientId;
    logger.debug(NAMESPACE, 'MQTT init', user);

    const transformUrl = (url, options, client) => {
      const token = kc.getToken();
      logger.debug(NAMESPACE, 'transformUrl');
      client.options.clientId = id;
      client.options.password = token;
      return url;
    };

    let options = {
      keepalive: mqttKeepalive,
      clientId: id,
      protocolId: 'MQTT',
      protocolVersion: 5,
      reconnectPeriod: 0,
      clean: false,
      username: user.email,
      password: kc.getToken(),
      transformWsUrl: transformUrl,
      log: (...args) => {
        logger.debug("MQTT LIB", args[0]);
      },
      properties: {
        sessionExpiryInterval: mqttTimeout,
        maximumPacketSize: 256000,
        requestResponseInformation: true,
        requestProblemInformation: true,
      },
      timerVariant: {
        set: (func, time) => {
          return BackgroundTimer.setInterval(func, time);
        },
        clear: timerId => {
          return BackgroundTimer.clearInterval(timerId);
        },
      },
    };

    const connectSpan = addSpan(CONNECTION, 'mqtt.connect');
    const mqttUrl = getEnvValue('MQTT_URL');
    logger.debug(NAMESPACE, 'Connecting to MQTT:', mqttUrl);
    try {
      this.mq = await mqtt.connectAsync(`wss://${mqttUrl}`, options);

      logger.debug(NAMESPACE, 'MQTT connected', this.mq.connected);
      finishSpan(connectSpan, 'ok', NAMESPACE);
    } catch (error) {
      logger.error(NAMESPACE, 'Error connecting to MQTT:', error);
      finishSpan(connectSpan, 'internal_error', NAMESPACE);
      finishSpan(initSpan, 'internal_error', NAMESPACE);
      throw error;
    }
    this.mq.setMaxListeners(50);

    this.mq.on('message', (topic, data, packet) => {
      logger.debug(NAMESPACE, 'message received at:', new Date().toISOString());
      logger.debug(NAMESPACE, 'message', topic, {
        ...packet,
        payload: packet.payload?.type,
      });
      if (!data?.toString) {
        logger.warn(NAMESPACE, 'message data has no toString method');
        addFinishSpan(
          CONNECTION,
          'mqtt.message',
          { topic, data, packet },
          'no_data_toString'
        );
        return;
      }

      let cd = packet?.properties?.correlationData
        ? ` | transaction: ${packet?.properties?.correlationData?.toString()}`
        : '';
      logger.debug(NAMESPACE, `<-- receive message${cd} | topic : ${topic}`);
      const t = topic.split('/');
      if (t[0] === 'msg') t.shift();
      const [root, service, id, target] = t;
      logger.debug(
        NAMESPACE,
        `<-- receive msg ${root} ${service} ${id} ${target}`
      );
      switch (root) {
        case 'subtitles':
          try {
            logger.debug(NAMESPACE, `On subtitles msg from topic ${topic}`);
            useSubtitleStore.getState().onMessage(data);
          } catch (e) {
            logger.error(NAMESPACE, e);
          }
          break;
        case 'mobile':
          if (service === 'releases') {
            try {
              logger.debug(NAMESPACE, `On mobile msg from topic ${topic}`);
              const msg = JSON.parse(data.toString());
              useVersionStore.getState().onMessage(msg);
            } catch (e) {
              logger.error(NAMESPACE, e);
            }
          }
          break;
        case 'galaxy':
          // FIXME: we need send cmd messages to separate topic
          if (service === 'room' && target === 'chat')
            useChatStore.getState().addRoomMsg(data);
          else if (
            (service === 'room' && target !== 'chat') ||
            (service === 'service' && id !== 'user')
          ) {
            try {
              let msg = JSON.parse(data.toString());
              this.handleControlMessage(msg);
            } catch (e) {
              let str = data
                .toString()
                .replace(/[^a-z0-9 -\{\}\,\:\[\]]/gi, '');
              try {
                let msg = JSON.parse(str);
                this.handleControlMessage(msg);
              } catch (e) {
                logger.error(NAMESPACE, e);
                logger.error(NAMESPACE, `Not valid JSON, ${data.toString()}`);
                return;
              }
            }
          } else if (service === 'users' && id === 'broadcast')
            useChatStore.getState().addSupportMsg(data);
          /*
          else if (service === 'users' && id === 'notification')
            this.mq.emit('MqttNotificationMessage', data);
          else if (service === 'users' && id === 'notification_test')
            this.mq.emit('MqttTestMessage', data);
          else
            this.mq.emit('MqttPrivateMessage', data);
          */
          break;
        case 'janus':
          try {
            logger.debug(NAMESPACE, 'janus');
            const dataStr = Buffer.isBuffer(data) ? data.toString() : data;
            const json = JSON.parse(dataStr);
            logger.debug(NAMESPACE, 'janus json:', json);
            const mit = json?.session_id || service;
            this.mq.emit(mit, data, id);
          } catch (e) {
            logger.error(NAMESPACE, 'Error parsing message:', e.message, data);
          }
          break;
        default:
          this.handleControlMessage(JSON.parse(data.toString()));
      }
    });

    this.mq.on('connect', data => {
      logger.debug(NAMESPACE, 'mqtt on connect', data);
      this.reconnectAttempts = 0;

      const connectSpan = addSpan(CONNECTION, 'mqtt.connectEvent', {
        NAMESPACE,
      });

      if (!data.sessionPresent && this.wasConnected) {
        addFinishSpan(CONNECTION, 'mqtt.connectEvent.resubscribe', {
          ...data,
          NAMESPACE,
        });
        Promise.all([
          useInRoomStore.getState().subscribeMqtt(),
          useInitsStore.getState().subscribeMqtt(),
        ])
          .then(() => {
            useInitsStore.getState().setMqttIsOn(true);
          })
          .catch(error => {
            logger.error(NAMESPACE, 'Error subscribing to MQTT topics:', error);
            useInitsStore.getState().setMqttIsOn(false);
          });
      } else {
        useInitsStore.getState().setMqttIsOn(true);
      }

      if (this.wasConnected) {
        useShidurStore.getState().reconnectMqtt();
        useFeedsStore.getState().reconnectMqtt();
      }

      this.wasConnected = true;
      finishSpan(connectSpan, 'ok', NAMESPACE);
    });

    this.mq.on('reconnect', data => {
      addFinishSpan(CONNECTION, 'mqtt.reconnect', { ...data, NAMESPACE });
      logger.debug(NAMESPACE, 'mqtt on reconnect', data, this.mq.connected);
    });

    this.mq.on('offline', data => {
      addFinishSpan(CONNECTION, 'mqtt.offline', { ...data, NAMESPACE });
      logger.debug(NAMESPACE, 'mqtt on offline', data);
    });

    this.mq.on('close', () => {
      addFinishSpan(CONNECTION, 'mqtt.close', {
        connected: this.mq?.connected,
        NAMESPACE,
      });
      logger.debug(NAMESPACE, 'mqtt on close, scheduling reconnect');
      this.reconnect();
    });

    this.mq.on('disconnect', data => {
      addFinishSpan(CONNECTION, 'mqtt.disconnect', { ...data, NAMESPACE });
      logger.debug(NAMESPACE, 'mqtt on disconnect', data);

      if (data?.reasonCode === 142) {
        logger.warn(NAMESPACE, 'Session taken over by another client', data);
      }
      if (data?.reasonCode === 135) {
        logger.warn(NAMESPACE, 'Not authorized', data);
      }
    });

    this.mq.on('end', data => {
      addFinishSpan(CONNECTION, 'mqtt.end', { ...data, NAMESPACE });
      logger.debug(NAMESPACE, 'mqtt on end', data);
    });

    this.mq.on('error', error => {
      addFinishSpan(CONNECTION, 'mqtt.error', { ...error, NAMESPACE });
      logger.error(NAMESPACE, 'mqtt on error', error);

      if (error?.message === 'Keepalive timeout') {
        logger.warn(NAMESPACE, 'Keepalive timeout - resetting connection');
      }
    });

    finishSpan(initSpan, 'ok', NAMESPACE);
    return this.mq;
  };

  sub = async (topic, opt = {}) => {
    if (!(await waitConnection())) {
      return;
    }

    logger.info(NAMESPACE, `Subscribe to: ${topic}`);
    let options = { qos: 1, nl: true, ...opt };
    try {
      const result = await this.mq.subscribeAsync(topic, { ...options });
      return result;
    } catch (error) {
      logger.error(NAMESPACE, 'Error subscribing to topic:', topic, error);
    }
  };

  exit = async topic => {
    logger.debug(NAMESPACE, `Unsubscribe from: ${topic}`);
    if (!(await waitConnection())) {
      return;
    }
    let options = {};
    return this.mq.unsubscribeAsync(topic, { ...options });
  };

  send = async (message, retain, topic, rxTopic) => {
    logger.debug(NAMESPACE, `Send message to: ${topic}`);
    if (!(await waitConnection())) {
      return;
    }
    const { user } = useUserStore.getState();
    let correlationData = JSON.parse(message)?.transaction;
    let cd = correlationData ? ` | transaction: ${correlationData}` : '';
    logger.debug(
      NAMESPACE,
      `--> send message ${cd} | topic: ${topic} | data: ${message}`
    );
    let properties = !!rxTopic
      ? {
        userProperties: user,
        responseTopic: rxTopic,
        correlationData,
      }
      : { userProperties: user };

    logger.debug(NAMESPACE, 'send properties', properties);
    let options = { qos: 1, retain, properties };
    try {
      const result = await this.mq.publishAsync(topic, message, { ...options });
      return result;
    } catch (error) {
      logger.error(NAMESPACE, 'Error sending message:', error);
    }
  };

  handleControlMessage = data => {
    logger.debug(NAMESPACE, 'got message: ', data);
    const { type, id } = data;

    const { user } = useUserStore.getState();
    const { restartRoom, exitRoom } = useInRoomStore.getState();
    const { toggleCammute, toggleMute } = useMyStreamStore.getState();
    const { streamGalaxy } = useShidurStore.getState();
    const { toggleQuestion } = useSettingsStore.getState();
    const { updateDisplayById } = useFeedsStore.getState();

    if (user.id === id && CLIENT_RECONNECT_TYPES.includes(type)) {
      restartRoom();
    } else if (type === 'client-kicked' && user.id === id) {
      try {
        exitRoom();
      } catch (e) {
        logger.debug(NAMESPACE, 'Error in exitRoom', e);
      }
      kc.logout();
    } else if (type === 'client-question' && user.id === id) {
      toggleQuestion();
    } else if (type === 'client-mute' && user.id === id) {
      toggleMute();
    } else if (type === 'video-mute' && user.id === id) {
      toggleCammute();
    } else if (type === 'audio-out') {
      logger.debug(NAMESPACE, 'audio-out: ', data);
      streamGalaxy(data.status);
      if (data.status) {
        // Remove question mark when sndman unmute our room
        toggleQuestion(false);
      }
    } else if (type === 'client-reload-all') {
      restartRoom();
    } else if (type === 'client-state') {
      updateDisplayById(data.user);
    }
  };

  reconnect = async () => {
    if (!this.mq) {
      logger.debug(NAMESPACE, 'reconnect: mqtt not initialized, skipping');
      return;
    }
    if (this.reconnecting) {
      logger.debug(NAMESPACE, 'reconnect: already in progress, skipping');
      return;
    }

    this.reconnectAttempts += 1;
    if (this.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
      logger.warn(
        NAMESPACE,
        'reconnect: exceeded max reconnect attempts, leaving room',
        this.reconnectAttempts
      );
      this.reconnectAttempts = 0;
      useInRoomStore.getState().exitRoom();
      return;
    }

    this.reconnecting = true;
    const reconnectSpan = addSpan(CONNECTION, 'mqtt.reconnect', { NAMESPACE });
    try {
      logger.debug(NAMESPACE, 'reconnect: triggering mqtt reconnect');
      this.mq.reconnect();
      logger.debug(NAMESPACE, 'reconnect: reconnect triggered', this.mq?.connected);
      finishSpan(reconnectSpan, 'ok', NAMESPACE);
    } catch (error) {
      logger.error(NAMESPACE, 'reconnect error', error);
      finishSpan(reconnectSpan, 'internal_error', NAMESPACE);
    } finally {
      this.reconnecting = false;
    }
  };

  end = async () => {
    const endSpan = addSpan(CONNECTION, 'mqtt.end');
    logger.debug(NAMESPACE, 'start of mqttend', this.mq);
    if (!this.mq) {
      finishSpan(endSpan, 'ok', NAMESPACE);
      return;
    }

    try {
      logger.debug(NAMESPACE, 'end removeAllListeners', this.mq);
      this.mq.removeAllListeners();
    } catch (e) {
      logger.error(NAMESPACE, 'end removeAllListeners', e);
      finishSpan(endSpan, 'internal_error', NAMESPACE);
    }
    try {
      logger.debug(NAMESPACE, 'endAsync', this.mq);
      await rejectTimeoutPromise(this.mq.endAsync(true), 3000);
      finishSpan(endSpan, 'ok', NAMESPACE);
    } catch (e) {
      logger.error(NAMESPACE, 'endAsync error', e);
      finishSpan(endSpan, 'internal_error', NAMESPACE);
    }
    this.mq = null;
    this.wasConnected = false;
    this.clientId = null;
    return true;
  };
}

const defaultMqtt = new MqttMsg();
export default defaultMqtt;
