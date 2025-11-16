import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';
import { randomString } from '../shared/tools';
import { useInRoomStore } from '../zustand/inRoom';
import { waitConnection } from './connection-monitor';
import { CONNECTION } from './sentry/constants';
import {
  addFinishSpan,
  addSpan,
  finishSpan,
  finishTransaction,
  setSpanAttributes,
  setTransactionAttributes,
  startTransaction,
} from './sentry/sentryHelper';

const NAMESPACE = 'JanusMqtt';

export class JanusMqtt {
  constructor(user, srv) {
    this.user = user;
    this.srv = srv;
    this.rxTopic = 'janus/' + srv + '/from-janus';
    this.txTopic = 'janus/' + srv + '/to-janus';
    this.stTopic = 'janus/' + srv + '/status';
    this.isConnected = false;
    this.sessionId = undefined;
    this.transactions = {};
    this.pluginHandles = {};
    this.keeptry = 0;
    this.token = null;
    this.connect = null;
    this.isJanusInitialized = false;
    this.keepAliveTimer = null;
    this.sentrySession = `${CONNECTION}.${srv}`;

    // Стрелочные функции автоматически связывают this
  }

  init = async token => {
    startTransaction(this.sentrySession, 'Janus Init', 'janus.init');
    if (!(await waitConnection())) {
      logger.warn(NAMESPACE, 'Connection unavailable in init');
      finishTransaction(this.sentrySession, 'no_connection');
      return;
    }
    this.token = token;
    logger.debug(NAMESPACE, 'init this.user', this.user);

    const subscribeSpan = addSpan(this.sentrySession, 'janus.subscribeTopics', {
      rxTopic: this.rxTopic,
      stTopic: this.stTopic,
    });

    try {
      await Promise.all([
        mqtt.sub(this.rxTopic + '/' + this.user.id, { qos: 0 }),
        mqtt.sub(this.rxTopic, { qos: 0 }),
        mqtt.sub(this.stTopic, { qos: 1 }),
      ]);
      finishSpan(subscribeSpan, 'ok');
    } catch (error) {
      logger.error(NAMESPACE, 'Error subscribing to MQTT topics:', error);
      finishSpan(subscribeSpan, 'internal_error');
      finishTransaction(this.sentrySession, 'internal_error');
      throw error;
    }

    logger.debug(NAMESPACE, 'init this.srv', this.srv);
    mqtt.mq.on(this.srv, this.onMessage);

    const transaction = randomString(12);
    const msg = { janus: 'create', transaction, token };

    // Create connectSpan in the init scope so it can be accessed in the promise chain
    const connectSpan = addSpan(this.sentrySession, 'janus.connect');

    this.connect = () => {
      logger.debug(NAMESPACE, 'connect', this.isJanusInitialized);
      this.isConnected = true;
      if (this.isJanusInitialized) {
        setSpanAttributes(connectSpan, {
          isJanusInitialized: this.isJanusInitialized,
        });
        finishSpan(connectSpan, 'ok');
        return;
      }

      this.isJanusInitialized = true;
      const sendResult = mqtt.send(
        JSON.stringify(msg),
        false,
        this.txTopic,
        this.rxTopic + '/' + this.user.id
      );
      return sendResult;
    };

    return new Promise((resolve, reject) => {
      logger.debug(NAMESPACE, 'in Promise');

      this.transactions[transaction] = {
        resolve: json => {
          logger.debug(NAMESPACE, 'transaction resolve', json);
          if (json.janus !== 'success') {
            logger.error(NAMESPACE, 'Cannot connect to Janus', json);
            reject(json);
            return;
          }

          this.sessionId = json.data.id;
          setTransactionAttributes(this.sentrySession, {
            sessionId: this.sessionId,
          });
          this.isConnected = true;
          this.keepAlive();

          logger.debug(
            NAMESPACE,
            'Janus connected, sessionId: ',
            this.sessionId
          );
          mqtt.mq.on(this.sessionId, this.onMessage);

          resolve(this);
        },
        reject: error => {
          reject(error);
        },
        replyType: 'success',
      };
    })
      .then(result => {
        finishSpan(connectSpan, 'ok');
        return result;
      })
      .catch(error => {
        finishSpan(connectSpan, 'internal_error');
        throw error;
      });
  };

  attach = async plugin => {
    logger.debug(NAMESPACE, 'attach', plugin?.getPluginName());
    const name = plugin.getPluginName();
    const body = { plugin: name, opaque_id: this.user.id };
    logger.debug(NAMESPACE, 'attach body', body);
    const json = await this.transaction('attach', body, 'success');

    if (json.janus !== 'success') {
      logger.error(NAMESPACE, 'Cannot add plugin', json.error);
      plugin.error(json);
      throw new Error(json);
    }

    this.pluginHandles[json.data.id] = plugin;
    plugin.isDestroyed = false;

    return plugin.success(this, json.data.id);
  };

  destroy = async () => {
    const destroySpan = addSpan(this.sentrySession, 'janus.destroy', {
      NAMESPACE,
    });
    logger.debug(NAMESPACE, 'destroy', this.isConnected);
    if (!this.isConnected) {
      this.clearKeepAliveTimer();
      finishSpan(destroySpan, 'ok');
      return;
    }

    try {
      await this._cleanupPlugins();
      logger.debug(NAMESPACE, 'destroy _cleanupPlugins done');
    } catch (err) {
      logger.error(NAMESPACE, 'cleanupPlugins err', err);
      finishSpan(destroySpan, 'internal_error');
    }

    try {
      await this.transaction('destroy', {}, 'success', 5000);
    } catch (err) {
      addFinishSpan(this.sentrySession, 'janus.destroy', err);
    }

    this._cleanupTransactions();

    this._cleanupMqtt();
    logger.debug(NAMESPACE, 'destroy done');
    finishSpan(destroySpan, 'ok', NAMESPACE);
    finishTransaction(this.sentrySession, 'ok', NAMESPACE);
    return true;
  };

  detach = async plugin => {
    if (!this.findHandle(plugin.janusHandleId)) {
      throw new Error('unknown plugin');
    }
    const body = {
      plugin: plugin.pluginName,
      handle_id: plugin.janusHandleId,
    };
    try {
      await this.transaction('hangup', body, 'success', 5000);
    } catch (err) {
      addFinishSpan(this.sentrySession, 'janus.destroy', err);
      plugin.detach();
      throw err;
    }
    delete this.pluginHandles[plugin.janusHandleId];
    return true;
  };

  _cleanupPlugins = () => {
    logger.debug(NAMESPACE, '_cleanupPlugins');
    const promises = Object.values(this.pluginHandles).map(plugin => {
      logger.debug(NAMESPACE, '_cleanupPlugins plugin:', plugin.janusHandleId);
      return this.detach(plugin);
    });
    return Promise.allSettled(promises);
  };

  transaction = async (type, payload, replyType = 'ack', timeoutMs) => {
    if (!type) {
      logger.error(NAMESPACE, 'Missing transaction type');
      return;
    }

    if (!(await waitConnection())) {
      logger.warn(NAMESPACE, 'Connection unavailable in transaction');
      return;
    }

    logger.debug(NAMESPACE, 'transaction', type, payload, replyType, timeoutMs);
    const transactionId = randomString(12);
    return new Promise((resolve, reject) => {
      logger.debug(NAMESPACE, 'transaction promise', transactionId);
      if (!this.isConnected) {
        addFinishSpan(
          this.sentrySession,
          'janus.transaction',
          'not_connected',
          { NAMESPACE }
        );
        return;
      }

      try {
        const request = Object.assign({}, payload, {
          token: this.token,
          janus: type,
          session_id: this.sessionId,
          transaction: transactionId,
        });

        if (
          type === 'keepalive' &&
          this.user.role === 'user' &&
          this.txTopic.match('gxy')
        ) {
          request.user = this.user;
        }

        this.transactions[request.transaction] = {
          resolve: result => {
            resolve(result);
          },
          reject: error => {
            reject(error);
          },
          replyType,
          request,
        };

        logger.debug(
          NAMESPACE,
          'transaction request',
          Object.keys(this.transactions)
        );

        mqtt.send(
          JSON.stringify(request),
          false,
          this.txTopic,
          this.rxTopic + '/' + this.user.id
        );
      } catch (error) {
        logger.error(
          NAMESPACE,
          'Error in transaction method',
          error?.message || JSON.stringify(error) || 'undefined'
        );
        delete this.transactions[transactionId];
        reject(error || new Error('Unknown transaction error'));
      }
    });
  };

  keepAlive = async () => {
    logger.debug(NAMESPACE, 'keepAlive tick', this.keeptry);
    logger.debug(NAMESPACE, 'keepAlive isConnected', this.isConnected);
    if (!this.isConnected) {
      return;
    }
    if (!(await waitConnection())) {
      logger.warn(NAMESPACE, 'Connection unavailable in keepAlive');
      return;
    }

    logger.debug(NAMESPACE, 'keepAlive sessionId', this.sessionId);
    if (!this.sessionId) {
      this.setKeepAliveTimer();
      return;
    }

    logger.debug(NAMESPACE, `Sending keepalive to: ${this.srv}`);
    try {
      const json = await this.transaction('keepalive', null, 'ack', 20 * 1000);
      logger.debug(NAMESPACE, 'keepAlive done', json);
      this.keeptry = 0;
      this.setKeepAliveTimer();
    } catch (err) {
      logger.debug(NAMESPACE, 'keepAlive error', err);
      if (!this.isConnected) {
        return;
      }
      logger.debug(NAMESPACE, err, this.keeptry);
      if (this.keeptry === 3) {
        logger.error(
          NAMESPACE,
          `keepalive is not reached (${this.srv}) after: ${this.keeptry} tries`
        );
        this.isConnected = false;
        useInRoomStore.getState().restartRoom();
        return;
      }
      this.setKeepAliveTimer();
      this.keeptry++;
    }
  };

  getTransaction = (json, ignoreReplyType = false) => {
    const type = json.janus;
    const transactionId = json.transaction;

    logger.debug(NAMESPACE, 'getTransaction', {
      type,
      transactionId,
      ignoreReplyType,
    });

    if (
      transactionId &&
      Object.prototype.hasOwnProperty.call(this.transactions, transactionId) &&
      (ignoreReplyType || this.transactions[transactionId].replyType === type)
    ) {
      const ret = this.transactions[transactionId];
      delete this.transactions[transactionId];
      return ret;
    }
    addFinishSpan(this.sentrySession, 'janus.getTransaction', {
      ...json,
      NAMESPACE,
    });
    return null;
  };

  onClose = () => {
    addFinishSpan(this.sentrySession, 'janus.onClose', { NAMESPACE });
    logger.debug(NAMESPACE, 'onClose');
    if (!this.isConnected) {
      this.clearKeepAliveTimer();
      return;
    }

    this.isConnected = false;
    logger.error(NAMESPACE, 'Lost connection to the gateway (is it down?)');
  };

  _cleanupTransactions = () => {
    logger.debug(NAMESPACE, '_cleanupTransactions');
    this.clearKeepAliveTimer();
    this.transactions = {};
    this.sessionId = null;
    this.isConnected = false;
  };

  _cleanupMqtt = async () => {
    logger.debug(NAMESPACE, '_cleanupMqtt');
    try {
      await Promise.all([
        mqtt.exit(this.rxTopic + '/' + this.user.id),
        mqtt.exit(this.rxTopic),
        mqtt.exit(this.stTopic),
      ]);
      logger.debug(NAMESPACE, '_cleanupMqtt mqtt topics exited');
    } catch (e) {
      logger.error(NAMESPACE, 'Error exiting MQTT topics:', e);
    }

    try {
      mqtt.mq.removeListener(this.srv, this.onMessage);
      if (this.sessionId)
        mqtt.mq.removeListener(this.sessionId, this.onMessage);
    } catch (e) {
      logger.error(NAMESPACE, 'Error removing MQTT listeners:', e);
    }
    logger.debug(NAMESPACE, '_cleanupMqtt done');
  };

  onMessage = (message, tD) => {
    let json;
    try {
      json = JSON.parse(message);
    } catch (err) {
      logger.error(NAMESPACE, 'Cannot parse message', message, err);
      return;
    }

    logger.debug(NAMESPACE, 'On message: ', json, tD);

    if (tD === 'status' && json.online) {
      addFinishSpan(this.sentrySession, 'janus.statusOnline');
      logger.debug(NAMESPACE, `Janus Server - ${this.srv} - Online`);
      this.connect();
      return;
    }

    if (!this.isConnected) {
      return;
    }

    if (tD === 'status' && !json.online) {
      addFinishSpan(this.sentrySession, 'janus.statusOffline');
      logger.debug(NAMESPACE, 'status');
      this.isConnected = false;
      logger.debug(NAMESPACE, `Janus Server - ${this.srv} - Offline`);
      useInRoomStore.getState().restartRoom();
      alert('Janus Server - ' + this.srv + ' - Offline');
      return;
    }

    const { janus } = json;
    logger.debug(NAMESPACE, 'janus', janus);

    if (janus === 'keepalive') {
      logger.debug(NAMESPACE, 'keepalive', json);
      // Do nothing
      return;
    }

    if (janus === 'ack') {
      // Just an ack, we can probably ignore
      const transaction = this.getTransaction(json);
      logger.debug(NAMESPACE, 'janus ack', transaction?.transactionId);
      if (transaction && transaction.resolve) {
        transaction.resolve(json);
      }
      return;
    }

    if (janus === 'success') {
      const transaction = this.getTransaction(json);
      if (!transaction) {
        return;
      }

      const pluginData = json.plugindata;
      logger.debug(NAMESPACE, 'pluginData', pluginData);
      if (!pluginData) {
        transaction.resolve(json);
        return;
      }

      const sender = json.sender;
      if (!sender) {
        transaction.resolve(json);
        logger.error(NAMESPACE, 'Missing sender for plugindata', json);
        return;
      }

      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        return;
      }

      transaction.resolve({ data: pluginData.data, json });
      return;
    }

    if (janus === 'timeout' && json.session_id !== this.sessionId) {
      logger.debug(NAMESPACE, 'Timeout from another session');
      return;
    }

    if (janus === 'webrtcup') {
      // The PeerConnection with the gateway is up! Notify this
      const webrtcUpSpan = addSpan(this.sentrySession, 'janus.webrtcUp');
      const sender = json.sender;
      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        finishSpan(webrtcUpSpan, 'internal_error');
        return;
      }
      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        finishSpan(webrtcUpSpan, 'internal_error');
        return;
      }
      finishSpan(webrtcUpSpan, 'ok');
      return;
    }
    if (janus === 'ice-failed') {
      logger.debug(NAMESPACE, 'ice-failed', json);
      // The PeerConnection with the gateway is down! Notify this
      const iceFailedSpan = addSpan(this.sentrySession, 'janus.iceFailed');
      const sender = json.sender;
      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        finishSpan(iceFailedSpan, 'no_sender');
        return;
      }
      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        finishSpan(iceFailedSpan, 'no_plugin_handle');
        return;
      }
      //TODO: Add iceFailed to plugin handle
      // pluginHandle.iceFailed && pluginHandle.iceFailed();
      finishSpan(iceFailedSpan, 'ok');
      return;
    }

    if (janus === 'hangup') {
      const hangupSpan = addSpan(this.sentrySession, 'janus.hangup', {
        reason: json.reason,
        NAMESPACE,
      });
      logger.debug(NAMESPACE, 'hangup');
      // A plugin asked the core to hangup a PeerConnection on one of our handles
      const sender = json.sender;
      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        finishSpan(hangupSpan, 'internal_error');
        return;
      }
      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        finishSpan(hangupSpan, 'internal_error');
        return;
      }
      pluginHandle.hangup && pluginHandle.hangup(json.reason);
      finishSpan(hangupSpan, 'ok');
      return;
    }

    if (janus === 'detached') {
      logger.debug(NAMESPACE, 'detached', json);
      // A plugin asked the core to detach one of our handles
      const sender = json.sender;
      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        return;
      }
      return;
    }

    if (janus === 'media') {
      logger.debug(NAMESPACE, 'media');
      // Media started/stopped flowing
      const sender = json.sender;
      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        return;
      }
      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        return;
      }
      pluginHandle.mediaState(json.type, json.receiving);
      return;
    }

    if (janus === 'slowlink') {
      const slowlinkSpan = addSpan(this.sentrySession, 'janus.slowlink', {
        sender: json.sender,
        uplink: json.uplink,
        nacks: json.nacks,
      });
      logger.debug(NAMESPACE, 'slowlink');
      // Trouble uplink or downlink
      logger.debug(
        NAMESPACE,
        `Got a slowlink event on session ${this.sessionId}`
      );
      logger.debug(NAMESPACE, json);
      const sender = json.sender;
      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        finishSpan(slowlinkSpan, 'no_sender');
        return;
      }
      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        finishSpan(slowlinkSpan, 'no_plugin_handle');
        return;
      }
      pluginHandle.slowLink(json.uplink, json.nacks);
      finishSpan(slowlinkSpan, 'ok');
      return;
    }

    if (janus === 'error') {
      // Oops, something wrong happened
      addFinishSpan(this.sentrySession, 'janus.error', {
        errorCode: json.error?.code,
        error: json.error?.reason || JSON.stringify(json.error),
      });
      logger.error(NAMESPACE, `Janus error response ${json}`);
      const transaction = this.getTransaction(json, true);
      if (transaction && transaction.reject) {
        if (transaction.request) {
          logger.debug(
            NAMESPACE,
            'rejecting transaction',
            transaction.request,
            json
          );
        }
        transaction.reject(json);
      } else {
        logger.error(
          NAMESPACE,
          'No transaction found for error response',
          json
        );
      }
      return;
    }

    if (janus === 'event') {
      logger.debug(NAMESPACE, 'Got event', json);
      const sender = json.sender;
      const transaction = this.getTransaction(json);

      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        return;
      }
      const pluginData = json.plugindata;
      if (pluginData === undefined || pluginData === null) {
        logger.error(NAMESPACE, 'Missing plugindata...');
        return;
      }

      const data = pluginData.data;
      if (transaction) {
        if (data.error_code) {
          transaction.reject({ data, json });
        } else {
          transaction.resolve({ data, json });
        }
        return;
      }

      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        return;
      }

      pluginHandle.onmessage(data, json);
      return;
    }

    logger.warn(
      NAMESPACE,
      `Unknown message/event ${janus} on session ${this.sessionId}`
    );
  };

  clearKeepAliveTimer = () => {
    logger.debug(NAMESPACE, 'clearKeepAliveTimer', this.keepAliveTimer);
    if (this.keepAliveTimer) {
      BackgroundTimer.clearTimeout(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  };

  setKeepAliveTimer = (ms = 20 * 1000) => {
    logger.debug(NAMESPACE, 'setKeepAliveTimer', ms);
    this.clearKeepAliveTimer();
    this.keepAliveTimer = BackgroundTimer.setTimeout(() => {
      logger.debug(NAMESPACE, 'keepAliveTimer tick', this.keepAliveTimer);
      this.keepAlive();
    }, ms);
  };

  findHandle = id => {
    const handler = this.pluginHandles[id];
    if (!handler) {
      logger.warn(NAMESPACE, 'Handler not found', id);
      return null;
    }
    if (!handler.pc || handler.pc.connectionState === 'closed') {
      logger.warn(NAMESPACE, 'PeerConnection closed');
      return null;
    }
    if (handler.isDestroyed) {
      logger.debug(NAMESPACE, 'Handler was destroyed', id, handler.pluginName);
      return null;
    }
    return handler;
  };
}
