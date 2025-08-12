import mqtt from 'mqtt';
//import GxyConfig from "./janus-utils";
import { MQTT_URL, MSG_URL } from '@env';
import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';

import { useChatStore } from '../zustand/chat';
import { useSubtitleStore } from '../zustand/subtitle';
import { useUserStore } from '../zustand/user';
import { isServiceID, userRolesEnum } from './enums';
import { randomString } from './tools';

const mqttTimeout = 30; // Seconds
const mqttKeepalive = 10; // Seconds

const NAMESPACE = 'Mqtt';

class MqttMsg {
  constructor() {
    this.user = null;
    this.mq = null;
    this.mit = null;
    this.isConnected = false;
    this.room = null;
    this.token = null;
  }

  init = async () => {
    const { user } = useUserStore.getState();
    const service = isServiceID(user.id);
    //const svc_token = GxyConfig?.globalConfig?.dynamic_config?.mqtt_auth;
    const token = service ? svc_token : this.token;
    const id = service ? user.id : user.id + '-' + randomString(3);
    logger.debug(NAMESPACE, 'MQTT init', user);

    const transformUrl = (url, options, client) => {
      client.options.clientId = service
        ? user.id
        : user.id + '-' + randomString(3);
      client.options.password = service ? svc_token : this.token;
      return url;
    };

    let options = {
      keepalive: mqttKeepalive,
      clientId: id,
      protocolId: 'MQTT',
      protocolVersion: 5,
      reconnectPeriod: 1000,
      clean: true,
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

    if (service) {
      options.will = {
        qos: 2,
        retain: true,
        topic: 'galaxy/service/' + user.role,
        payload: JSON.stringify({ type: 'event', [user.role]: false }),
        properties: { userProperties: user },
      };
    }

    const url =
      user.role !== userRolesEnum.user && !service && user?.isClient
        ? MQTT_URL
        : MSG_URL;
    logger.debug(NAMESPACE, 'Connecting to MQTT:', url);
    try {
      this.mq = await mqtt.connectAsync(`wss://${url}`, options);
    } catch (error) {
      logger.error(NAMESPACE, 'Error connecting to MQTT:', error);
      throw error;
    }
    this.mq.setMaxListeners(50);

    this.mq.on('connect', data => {
      logger.debug(NAMESPACE, 'mqtt on connect', data);
      this.isConnected = true;
    });
    this.mq.on('reconnect', data => {
      logger.debug(NAMESPACE, 'mqtt on reconnect', data);
    });
    this.mq.on('close', () => {
      logger.debug(NAMESPACE, 'mqtt on close');
      this.isConnected = false;
    });
    this.mq.on('error', error => {
      logger.error(NAMESPACE, 'mqtt on error', error);
    });
    return this.mq;
  };

  join = async (topic, chat) => {
    if (!this.mq) return;
    logger.info(NAMESPACE, `Subscribe to: ${topic}`);
    let options = chat ? { qos: 0, nl: false } : { qos: 1, nl: true };
    return this.mq.subscribeAsync(topic, { ...options });
  };

  sub = (topic, qos) => {
    if (!this.mq) return;
    logger.info(NAMESPACE, `Subscribe to: ${topic}`);
    let options = { qos, nl: true };
    return this.mq.subscribeAsync(topic, { ...options });
  };

  exit = async topic => {
    logger.debug(NAMESPACE, `Unsubscribe from: ${topic}`);
    if (!this.mq) return;
    let options = {};
    logger.info(NAMESPACE, `Unsubscribe from: ${topic}`);
    return this.mq.unsubscribeAsync(topic, { ...options });
  };

  send = (message, retain, topic, rxTopic) => {
    logger.debug(NAMESPACE, `Send message to: ${topic}`);
    if (!this.mq) return;
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
    return this.mq.publishAsync(topic, message, { ...options });
  };

  watch = callback => {
    this.mq.on('message', (topic, data, packet) => {
      logger.debug(NAMESPACE, 'message', topic, packet);
      if (
        packet.payload?.type === 'Buffer' &&
        Array.isArray(packet.payload.data)
      ) {
        const payload = Buffer.from(packet.payload.data).toString();
        logger.trace(NAMESPACE, '<-- receive packet: ', { ...packet, payload });
      } else {
        logger.trace(NAMESPACE, '<-- receive packet: ', packet);
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
            logger.error(NAMESPACE, e);
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
    this.isConnected = false;
    if (!this.mq) return;
    this.mq.removeAllListeners();
    await this.mq.endAsync();
    this.mq = null;
    return true;
  };
}

const defaultMqtt = new MqttMsg();

const restartMqtt = async () => {
  logger.debug(NAMESPACE, 'restartMqtt');
  try {
    await defaultMqtt.end();
    defaultMqtt.mq = await defaultMqtt.init();
  } catch (e) {
    logger.error(NAMESPACE, 'restartMqtt error', e);
  }
};

export default defaultMqtt;
