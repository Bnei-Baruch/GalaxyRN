import mqtt from 'mqtt';
//import GxyConfig from "./janus-utils";
import { MQTT_URL, MSG_URL } from '@env';
import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';

import { useChatStore } from '../zustand/chat';
import { useSubtitleStore } from '../zustand/subtitle';
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
    this.reconnect_count = 0;
  }

  init = (user, callback) => {
    this.user = user;
    const RC = mqttTimeout;
    const service = isServiceID(user.id);
    //const svc_token = GxyConfig?.globalConfig?.dynamic_config?.mqtt_auth;
    const token = service ? svc_token : this.token;
    const id = service ? user.id : user.id + '-' + randomString(3);

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

    this.mq = mqtt.connect(`wss://${url}`, options);
    this.mq.setMaxListeners(50);

    this.mq.on('connect', data => {
      logger.debug(NAMESPACE, 'connect', data);
      if (data) {
        logger.info(NAMESPACE, `Connected to server: ${data}`);
        this.isConnected = true;
        if (typeof callback === 'function') callback(false, false);
      } else {
        logger.info(NAMESPACE, `Connected: ${data}`);
        this.isConnected = true;
        if (this.reconnect_count > RC) {
          if (typeof callback === 'function') callback(true, false);
        }
        this.reconnect_count = 0;
      }
    });

    this.mq.on('close', () => {
      logger.debug(NAMESPACE, 'close');
      if (this.reconnect_count < RC + 2) {
        this.reconnect_count++;
        logger.debug(
          NAMESPACE,
          `Reconnecting counter: ${this.reconnect_count}`
        );
      }
      if (this.reconnect_count === RC) {
        this.reconnect_count++;
        logger.warn(
          NAMESPACE,
          `Disconnected after ${this.reconnect_count} seconds`
        );
        if (typeof callback === 'function') callback(false, true);
      }
    });
  };

  join = (topic, chat) => {
    if (!this.mq) return;
    logger.info(NAMESPACE, `Subscribe to: ${topic}`);
    let options = chat ? { qos: 0, nl: false } : { qos: 1, nl: true };
    this.mq.subscribe(topic, { ...options }, err => {
      err && logger.error(NAMESPACE, `Error: ${err}`);
    });
  };

  sub = (topic, qos) => {
    if (!this.mq) return;
    logger.info(NAMESPACE, `Subscribe to: ${topic}`);
    let options = { qos, nl: true };
    this.mq.subscribe(topic, { ...options }, err => {
      err && logger.error(NAMESPACE, `Error: ${err}`);
    });
  };

  exit = topic => {
    logger.debug(NAMESPACE, `Unsubscribe from: ${topic}`);
    if (!this.mq) return;
    let options = {};
    logger.info(NAMESPACE, `Unsubscribe from: ${topic}`);
    return new Promise((resolve, reject) => {
      this.mq.unsubscribe(topic, { ...options }, err => {
        err && logger.error(NAMESPACE, `Error: ${err}`);
        err ? reject(err) : resolve();
      });
    });
  };

  send = (message, retain, topic, rxTopic, user) => {
    logger.debug(NAMESPACE, `Send message to: ${topic}`);
    if (!this.mq) return;
    let correlationData = JSON.parse(message)?.transaction;
    let cd = correlationData ? ` | transaction: ${correlationData}` : '';
    logger.debug(
      NAMESPACE,
      `--> send message${cd} | topic: ${topic} | data: ${message}`
    );
    let properties = !!rxTopic
      ? {
          userProperties: user || this.user,
          responseTopic: rxTopic,
          correlationData,
        }
      : { userProperties: user || this.user };

    logger.debug(NAMESPACE, 'send properties', properties);
    let options = { qos: 1, retain, properties };
    this.mq.publish(topic, message, { ...options }, err => {
      err && logger.error(NAMESPACE, 'Error: ', err);
    });
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
          if (typeof callback === 'function')
            callback(JSON.parse(data.toString()), topic);
      }
    });
  };

  setToken = token => {
    this.token = token;
  };

  end = () => {
    this.isConnected = false;
    this.reconnect_count = 0;
    return new Promise((resolve, reject) => {
      if (!this.mq) {
        resolve();
        return;
      }
      this.mq.removeAllListeners();
      this.mq.end(err => {
        this.mq = null;
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };
}

const defaultMqtt = new MqttMsg();

export default defaultMqtt;
