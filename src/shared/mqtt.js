import mqtt from 'mqtt';
//import GxyConfig from "./janus-utils";
import { MQTT_URL } from '@env';
import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';

import { useChatStore } from '../zustand/chat';

import { waitConnection } from '../libs/connection-monitor';
import { CONNECTION } from '../libs/sentry/constants';
import {
  addFinishSpan,
  addSpan,
  finishSpan,
} from '../libs/sentry/sentryHelper';
import { useInitsStore } from '../zustand/inits';
import { useSubtitleStore } from '../zustand/subtitle';
import { useUserStore } from '../zustand/user';
import { useVersionStore } from '../zustand/version';
import { randomString, rejectTimeoutPromise } from './tools';

const mqttTimeout = 30; // Seconds
const mqttKeepalive = 10; // Seconds

const NAMESPACE = 'Mqtt';

class MqttMsg {
  constructor() {
    this.user = null;
    this.mq = null;
    this.mit = null;
    this.room = null;
    this.token = null;
    this.initialized = false;
  }

  init = async () => {
    const initSpan = addSpan(CONNECTION, 'mqtt.init');
    this.initialized = true;

    const { user } = useUserStore.getState();
    //const svc_token = GxyConfig?.globalConfig?.dynamic_config?.mqtt_auth;
    const token = this.token;
    const id = user.id + '-' + randomString(3);
    logger.debug(NAMESPACE, 'MQTT init', user);

    const transformUrl = (url, options, client) => {
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
      password: token,
      transformWsUrl: transformUrl,
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
        clear: timerId => BackgroundTimer.clearInterval(timerId),
      },
    };

    const connectSpan = addSpan(CONNECTION, 'mqtt.connect');
    logger.debug(NAMESPACE, 'Connecting to MQTT:', MQTT_URL);
    try {
      this.mq = await rejectTimeoutPromise(
        mqtt.connectAsync(`wss://${MQTT_URL}`, options),
        2000
      );
      logger.debug(NAMESPACE, 'MQTT connected', this.mq.connected);
      finishSpan(connectSpan, 'ok');
    } catch (error) {
      logger.error(NAMESPACE, 'Error connecting to MQTT:', error);
      finishSpan(connectSpan, 'internal_error');
      finishSpan(initSpan, 'internal_error');
      throw error;
    }
    this.mq.setMaxListeners(50);

    this.mq.on('connect', data => {
      logger.debug(NAMESPACE, 'mqtt on connect', data);

      const connectOkSpan = addSpan(CONNECTION, 'mqtt.connectEvent');

      useInitsStore.getState().setMqttIsOn(true);

      if (!data.sessionPresent) {
        logger.error(NAMESPACE, 'Session not restored, resubscribing...');
      }
      finishSpan(connectOkSpan, 'ok');
    });

    this.mq.on('reconnect', data => {
      addFinishSpan(CONNECTION, 'mqtt.reconnect');
      logger.debug(NAMESPACE, 'mqtt on reconnect', data, this.mq.connected);
    });

    this.mq.on('offline', data => {
      addFinishSpan(CONNECTION, 'mqtt.offline');
      logger.debug(NAMESPACE, 'mqtt on offline', data);
    });

    this.mq.on('close', () => {
      addFinishSpan(CONNECTION, 'mqtt.close');
      logger.debug(NAMESPACE, 'mqtt on close');
    });

    this.mq.on('disconnect', data => {
      addFinishSpan(CONNECTION, 'mqtt.disconnect');
      logger.debug(NAMESPACE, 'mqtt on disconnect', data);
    });

    this.mq.on('end', data => {
      addFinishSpan(CONNECTION, 'mqtt.end');
      logger.debug(NAMESPACE, 'mqtt on end', data);
    });

    this.mq.on('error', error => {
      addFinishSpan(CONNECTION, 'mqtt.error');
      logger.error(NAMESPACE, 'mqtt on error', error);
    });

    finishSpan(initSpan, 'ok');
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
      throw error;
    }
  };

  exit = async topic => {
    logger.debug(NAMESPACE, `Unsubscribe from: ${topic}`);
    if (!(await waitConnection())) {
      return;
    }
    let options = {};
    logger.info(NAMESPACE, `Unsubscribe from: ${topic}`);
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
      throw error;
    }
  };

  watch = callback => {
    logger.debug(NAMESPACE, 'watch');
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
              callback(msg, topic);
            } catch (e) {
              let str = data
                .toString()
                .replace(/[^a-z0-9 -\{\}\,\:\[\]]/gi, '');
              try {
                let msg = JSON.parse(str);
                callback(msg, topic);
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
            logger.debug(NAMESPACE, 'janus', id);
            const json = JSON.parse(data);
            const mit =
              json?.session_id ||
              packet?.properties?.userProperties?.mit ||
              service;
            this.mq.emit(mit, data, id);
          } catch (e) {
            logger.debug(NAMESPACE, 'janus data type:', typeof data);
            logger.debug(NAMESPACE, 'janus data length:', data?.length);
            if (data?.toString) {
              logger.debug(NAMESPACE, 'janus data toString:', data?.toString());
            }
            logger.error(NAMESPACE, 'Error parsing janus message:', e.message);
            logger.error(NAMESPACE, 'janus data raw:', data);
          }
          break;
        default:
          callback(JSON.parse(data.toString()), topic);
      }
    });
  };

  setToken = token => {
    this.token = token;
  };

  end = async () => {
    const endSpan = addSpan(CONNECTION, 'mqtt.end');
    logger.debug(NAMESPACE, 'start of mqttend', this.mq);
    if (!this.mq) {
      finishSpan(endSpan, 'ok');
      return;
    }

    try {
      logger.debug(NAMESPACE, 'end removeAllListeners', this.mq);
      this.mq.removeAllListeners();
    } catch (e) {
      logger.error(NAMESPACE, 'end removeAllListeners', e);
      finishSpan(endSpan, 'internal_error');
    }
    try {
      logger.debug(NAMESPACE, 'endAsync', this.mq);
      await this.mq.endAsync();
      finishSpan(endSpan, 'ok');
    } catch (e) {
      logger.error(NAMESPACE, 'endAsync error', e);
      finishSpan(endSpan, 'internal_error');
    }
    this.mq = null;
    return true;
  };
}

const defaultMqtt = new MqttMsg();
export default defaultMqtt;
