import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';
import { randomString } from '../shared/tools';
import { useInRoomStore } from '../zustand/inRoom';
import { netIsConnected, waitConnection } from './connection-monitor';

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
    this.sendCreate = true;
    this.keeptry = 0;
    this.token = null;
    this.connect = null;
    this.isJanusInitialized = false;
    this.keepAliveTimer = null;
    // Стрелочные функции автоматически связывают this
  }

  init = async token => {
    const isConnected = await waitConnection();
    if (!isConnected) {
      return;
    }
    this.token = token;
    logger.debug(NAMESPACE, 'init this.user', this.user);
    try {
      await Promise.all([
        mqtt.sub(this.rxTopic + '/' + this.user.id, 0),
        mqtt.sub(this.rxTopic, 0),
        mqtt.sub(this.stTopic, 1),
      ]);
    } catch (error) {
      logger.error(NAMESPACE, 'Error subscribing to MQTT topics:', error);
      throw error;
    }
    logger.debug(NAMESPACE, 'init this.srv', this.srv);
    mqtt.mq.on(this.srv, this.onMessage);

    const transaction = randomString(12);
    const msg = { janus: 'create', transaction, token };

    this.connect = () => {
      logger.debug(NAMESPACE, 'connect', this.isJanusInitialized);
      this.isConnected = true;
      if (this.isJanusInitialized) {
        return;
      }

      this.isJanusInitialized = true;
      return mqtt.send(
        JSON.stringify(msg),
        false,
        this.txTopic,
        this.rxTopic + '/' + this.user.id
      );
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
          this.isConnected = true;
          this.keepAlive(false);

          logger.debug(
            NAMESPACE,
            'Janus connected, sessionId: ',
            this.sessionId
          );
          mqtt.mq.on(this.sessionId, this.onMessage);

          resolve(this);
        },
        reject,
        replyType: 'success',
      };
    });
  };

  disconnect = async json => {
    logger.debug(NAMESPACE, 'disconnect', json);
    await this._cleanupTransactions();
  };

  attach = async plugin => {
    logger.debug(NAMESPACE, 'attach', plugin);
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
    logger.debug(NAMESPACE, 'destroy', this.isConnected);
    if (!this.isConnected) {
      this.clearKeepAliveTimer();
      return;
    }

    try {
      await this._cleanupPlugins();
      logger.debug(NAMESPACE, 'destroy _cleanupPlugins done');
      const json = await this.transaction('destroy', {}, 'success', 5000);
      logger.debug(NAMESPACE, 'Janus destroyed');
      await this._cleanupTransactions();
      logger.debug(NAMESPACE, 'destroy _cleanupTransactions done');
      return json;
    } catch (err) {
      logger.error(NAMESPACE, 'destroy err', JSON.stringify(err));
    }
  };

  detach = async plugin => {
    logger.debug(
      NAMESPACE,
      'detach plugin',
      plugin,
      Object.keys(this.pluginHandles)
    );
    if (!this.findHandle(plugin.janusHandleId)) {
      throw new Error('unknown plugin');
    }
    const body = {
      plugin: plugin.pluginName,
      handle_id: plugin.janusHandleId,
    };
    const json = await this.transaction('hangup', body, 'success', 5000);
    if (json.janus !== 'success') {
      throw new Error('hangup failed');
    }
    delete this.pluginHandles[plugin.janusHandleId];
    plugin.detach();
    return json;
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
    const isConnected = await waitConnection();
    if (!isConnected) {
      logger.error(NAMESPACE, 'Connection unavailable');
      return Promise.reject(new Error('Network connection unavailable'));
    }
    logger.debug(NAMESPACE, 'transaction', type, payload, replyType, timeoutMs);
    const transactionId = randomString(12);
    return new Promise((resolve, reject) => {
      logger.debug(NAMESPACE, 'transaction promise', transactionId);
      if (!this.isConnected) {
        reject(new Error('Janus is not connected'));
        return;
      }

      try {
        // Validate inputs
        if (!type) {
          return reject(new Error('Missing transaction type'));
        }

        const request = Object.assign({}, payload, {
          token: this.token,
          janus: type,
          session_id:
            (payload && parseInt(payload.session_id, 10)) || this.sessionId,
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
          resolve,
          reject,
          replyType,
          request,
        };

        if (timeoutMs) {
          this.transactions[transactionId].timeout = BackgroundTimer.setTimeout(
            () => {
              logger.debug(NAMESPACE, 'transaction timeout', transactionId);
              // Clean up transaction on timeout
              if (this.transactions[transactionId]) {
                delete this.transactions[transactionId];
                reject(
                  new Error(`Transaction timed out after ${timeoutMs} ms`)
                );
              }
            },
            timeoutMs
          );
        }

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

  keepAlive = () => {
    logger.debug(NAMESPACE, 'keepAlive tick', this.keeptry);
    if (!this.isConnected || !this.sessionId || !netIsConnected()) {
      this.setKeepAliveTimer();
      return;
    }

    logger.debug(NAMESPACE, `Sending keepalive to: ${this.srv}`);
    this.transaction('keepalive', null, 'ack', 20 * 1000)
      .then(() => {
        this.keeptry = 0;
        this.setKeepAliveTimer();
      })
      .catch(err => {
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
      });
  };

  getTransaction = (json, ignoreReplyType = false) => {
    logger.debug(
      NAMESPACE,
      'getTransaction',
      json?.plugindata,
      ignoreReplyType
    );
    const type = json.janus;
    const transactionId = json.transaction;
    if (
      transactionId &&
      Object.prototype.hasOwnProperty.call(this.transactions, transactionId) &&
      (ignoreReplyType || this.transactions[transactionId].replyType === type)
    ) {
      const ret = this.transactions[transactionId];
      BackgroundTimer.clearTimeout(ret.timeout);
      delete this.transactions[transactionId];
      return ret;
    }
  };

  onClose = () => {
    logger.debug(NAMESPACE, 'onClose');
    if (!this.isConnected) {
      this.clearKeepAliveTimer();
      return;
    }

    this.isConnected = false;
    logger.error(NAMESPACE, 'Lost connection to the gateway (is it down?)');
  };

  _cleanupTransactions = async () => {
    logger.debug(NAMESPACE, '_cleanupTransactions');
    this.clearKeepAliveTimer();
    const promises = Object.values(this.transactions).map(t => {
      logger.debug(NAMESPACE, '_cleanupTransactions', t?.transactionId);
      return t.reject();
    });
    await Promise.allSettled(promises);
    logger.debug(NAMESPACE, '_cleanupTransactions done');
    this.transactions = {};
    this.sessionId = null;
    this.isConnected = false;

    try {
      await mqtt.exit(this.rxTopic + '/' + this.user.id);
      await mqtt.exit(this.rxTopic);
      await mqtt.exit(this.stTopic);
      logger.debug(NAMESPACE, '_cleanupTransactions mqtt topics exited');
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
    logger.debug(NAMESPACE, '_cleanupTransactions done');
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
      logger.debug(NAMESPACE, `Janus Server - ${this.srv} - Online`);
      this.connect();
      return;
    }

    if (tD === 'status' && !json.online) {
      logger.debug(NAMESPACE, 'status');
      this.isConnected = false;
      logger.debug(NAMESPACE, `Janus Server - ${this.srv} - Offline`);
      useInRoomStore.getState().exitRoom();
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
      if (pluginData === undefined || pluginData === null) {
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
      const sender = json.sender;
      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        return;
      }
      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        return;
      }
      pluginHandle.webrtcState(true);
      return;
    }

    if (janus === 'hangup') {
      logger.debug(NAMESPACE, 'hangup');
      // A plugin asked the core to hangup a PeerConnection on one of our handles
      const sender = json.sender;
      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        return;
      }
      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        return;
      }
      pluginHandle.webrtcState(false, json.reason);
      pluginHandle.hangup();
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
        return;
      }
      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        return;
      }
      pluginHandle.slowLink(json.uplink, json.nacks);
      return;
    }

    if (janus === 'error') {
      // Oops, something wrong happened
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
      }
      return;
    }

    if (janus === 'event') {
      logger.debug(NAMESPACE, 'Got event', json);
      const sender = json.sender;
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
      const transaction = this.getTransaction(json);
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
    if (this.keepAliveTimer) {
      BackgroundTimer.clearTimeout(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  };

  setKeepAliveTimer = (ms = 20 * 1000) => {
    this.clearKeepAliveTimer();
    this.keepAliveTimer = BackgroundTimer.setTimeout(() => {
      logger.debug(NAMESPACE, 'keepAliveTimer tick');
      this.keepAlive();
    }, ms);
  };
  findHandle = id => {
    const handler = this.pluginHandles[id];
    if (!handler) {
      logger.error(NAMESPACE, 'Handler not found', id);
      return null;
    }
    if (handler.isDestroyed) {
      logger.error(NAMESPACE, 'Handler is destroyed', id);
      return null;
    }
    return handler;
  };
}
