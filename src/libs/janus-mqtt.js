import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';
import { randomString } from '../shared/tools';
import { useInRoomStore } from '../zustand/inRoom';
import { waitConnection } from './connection-monitor';
import { CONNECTION } from './sentry/constants';
import { addSpan, finishSpan } from './sentry/sentryHelper';

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
    // Стрелочные функции автоматически связывают this
  }

  init = async token => {
    const initSpan = addSpan(CONNECTION, 'janus.init', { srv: this.srv });
    if (!(await waitConnection())) {
      logger.warn(NAMESPACE, 'Connection unavailable in init');
      finishSpan(initSpan, 'no_connection');
      return;
    }
    this.token = token;
    logger.debug(NAMESPACE, 'init this.user', this.user);

    const subscribeSpan = addSpan(CONNECTION, 'janus.subscribeTopics', {
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
      finishSpan(initSpan, 'internal_error');
      throw error;
    }

    logger.debug(NAMESPACE, 'init this.srv', this.srv);
    mqtt.mq.on(this.srv, this.onMessage);

    const transaction = randomString(12);
    const msg = { janus: 'create', transaction, token };

    this.connect = () => {
      const connectSpan = addSpan(CONNECTION, 'janus.connect', {
        srv: this.srv,
        isJanusInitialized: this.isJanusInitialized,
      });
      logger.debug(NAMESPACE, 'connect', this.isJanusInitialized);
      this.isConnected = true;
      if (this.isJanusInitialized) {
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
      finishSpan(connectSpan, 'ok');
      return sendResult;
    };

    return new Promise((resolve, reject) => {
      logger.debug(NAMESPACE, 'in Promise');

      this.transactions[transaction] = {
        resolve: json => {
          const resolveSpan = addSpan(CONNECTION, 'janus.initResolve', {
            janus: json.janus,
            srv: this.srv,
          });
          logger.debug(NAMESPACE, 'transaction resolve', json);
          if (json.janus !== 'success') {
            logger.error(NAMESPACE, 'Cannot connect to Janus', json);
            finishSpan(resolveSpan, 'internal_error');
            finishSpan(initSpan, 'internal_error');
            reject(json);
            return;
          }

          this.sessionId = json.data.id;
          this.isConnected = true;
          this.keepAlive();

          logger.debug(
            NAMESPACE,
            'Janus connected, sessionId: ',
            this.sessionId
          );
          mqtt.mq.on(this.sessionId, this.onMessage);

          finishSpan(resolveSpan, 'ok');
          finishSpan(initSpan, 'ok');
          resolve(this);
        },
        reject: error => {
          const rejectSpan = addSpan(CONNECTION, 'janus.initReject', {
            srv: this.srv,
            error: error?.message || JSON.stringify(error),
          });
          finishSpan(rejectSpan, 'internal_error');
          finishSpan(initSpan, 'internal_error');
          reject(error);
        },
        replyType: 'success',
      };
    });
  };

  disconnect = async json => {
    const disconnectSpan = addSpan(CONNECTION, 'janus.disconnect', {
      srv: this.srv,
      isConnected: this.isConnected,
      sessionId: this.sessionId,
      json: json ? JSON.stringify(json) : null,
    });
    logger.debug(NAMESPACE, 'disconnect', json);
    try {
      await this._cleanupTransactions();
      finishSpan(disconnectSpan, 'ok');
    } catch (error) {
      logger.error(NAMESPACE, 'Error in disconnect:', error);
      finishSpan(disconnectSpan, 'internal_error');
    }
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
    const destroySpan = addSpan(CONNECTION, 'janus.destroy', {
      srv: this.srv,
      isConnected: this.isConnected,
      sessionId: this.sessionId,
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
      logger.error(NAMESPACE, 'destroy err', err);
      finishSpan(destroySpan, 'internal_error');
    }

    try {
      logger.debug(NAMESPACE, 'Janus destroyed');
      await this._cleanupTransactions();
      logger.debug(NAMESPACE, 'destroy _cleanupTransactions done');
      finishSpan(destroySpan, 'ok');
    } catch (err) {
      logger.error(NAMESPACE, 'cleanupTransactions err', err);
      finishSpan(destroySpan, 'internal_error');
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
    if (!type) {
      return reject(new Error('Missing transaction type'));
    }

    if (!(await waitConnection())) {
      logger.warn(NAMESPACE, 'Connection unavailable in transaction');
      return;
    }

    const transactionSpan = addSpan(CONNECTION, 'janus.transaction', {
      type,
      replyType,
      srv: this.srv,
      sessionId: this.sessionId,
      timeoutMs,
    });

    logger.debug(NAMESPACE, 'transaction', type, payload, replyType, timeoutMs);
    const transactionId = randomString(12);
    return new Promise((resolve, reject) => {
      logger.debug(NAMESPACE, 'transaction promise', transactionId);
      if (!this.isConnected) {
        finishSpan(transactionSpan, 'internal_error');
        reject(new Error('Janus is not connected'));
        return;
      }

      try {
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
          resolve: result => {
            finishSpan(transactionSpan, 'ok');
            resolve(result);
          },
          reject: error => {
            finishSpan(transactionSpan, 'internal_error');
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
        finishSpan(transactionSpan, 'internal_error');
        reject(error || new Error('Unknown transaction error'));
      }
    });
  };

  keepAlive = async () => {
    const keepAliveSpan = addSpan(CONNECTION, 'janus.keepAlive', {
      keeptry: this.keeptry,
      isConnected: this.isConnected,
      srv: this.srv,
      sessionId: this.sessionId,
    });
    logger.debug(NAMESPACE, 'keepAlive tick', this.keeptry);
    logger.debug(NAMESPACE, 'keepAlive isConnected', this.isConnected);
    if (!this.isConnected) {
      finishSpan(keepAliveSpan, 'ok');
      return;
    }
    if (!(await waitConnection())) {
      logger.warn(NAMESPACE, 'Connection unavailable in keepAlive');
      finishSpan(keepAliveSpan, 'no_connection');
      return;
    }

    logger.debug(NAMESPACE, 'keepAlive sessionId', this.sessionId);
    if (!this.sessionId) {
      this.setKeepAliveTimer();
      finishSpan(keepAliveSpan, 'ok');
      return;
    }

    logger.debug(NAMESPACE, `Sending keepalive to: ${this.srv}`);
    try {
      const json = await this.transaction('keepalive', null, 'ack', 20 * 1000);
      logger.debug(NAMESPACE, 'keepAlive done', json);
      this.keeptry = 0;
      this.setKeepAliveTimer();
      finishSpan(keepAliveSpan, 'ok');
    } catch (err) {
      logger.debug(NAMESPACE, 'keepAlive error', err);
      if (!this.isConnected) {
        finishSpan(keepAliveSpan, 'ok');
        return;
      }
      logger.debug(NAMESPACE, err, this.keeptry);
      if (this.keeptry === 3) {
        logger.error(
          NAMESPACE,
          `keepalive is not reached (${this.srv}) after: ${this.keeptry} tries`
        );
        this.isConnected = false;
        finishSpan(keepAliveSpan, 'no_connection');
        useInRoomStore.getState().restartRoom();
        return;
      }
      this.setKeepAliveTimer();
      this.keeptry++;
      finishSpan(keepAliveSpan, 'timeout_retry');
    }
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
      delete this.transactions[transactionId];
      return ret;
    }
  };

  onClose = () => {
    const onCloseSpan = addSpan(CONNECTION, 'janus.onClose', {
      srv: this.srv,
      isConnected: this.isConnected,
      sessionId: this.sessionId,
    });
    logger.debug(NAMESPACE, 'onClose');
    if (!this.isConnected) {
      this.clearKeepAliveTimer();
      finishSpan(onCloseSpan, 'ok');
      return;
    }

    this.isConnected = false;
    logger.error(NAMESPACE, 'Lost connection to the gateway (is it down?)');
    finishSpan(onCloseSpan, 'ok');
  };

  _cleanupTransactions = async () => {
    logger.debug(NAMESPACE, '_cleanupTransactions');
    this.clearKeepAliveTimer();
    const promises = Object.values(this.transactions)
      .filter(t => !!t)
      .map(t => {
        logger.debug(NAMESPACE, '_cleanupTransactions', t.transactionId);
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
      const statusOnlineSpan = addSpan(CONNECTION, 'janus.statusOnline', {
        srv: this.srv,
        isJanusInitialized: this.isJanusInitialized,
      });
      logger.debug(NAMESPACE, `Janus Server - ${this.srv} - Online`);
      this.connect();
      finishSpan(statusOnlineSpan, 'ok');
      return;
    }

    if (!this.isConnected) {
      return;
    }

    if (tD === 'status' && !json.online) {
      const statusOfflineSpan = addSpan(CONNECTION, 'janus.statusOffline', {
        srv: this.srv,
      });
      logger.debug(NAMESPACE, 'status');
      this.isConnected = false;
      logger.debug(NAMESPACE, `Janus Server - ${this.srv} - Offline`);
      finishSpan(statusOfflineSpan, 'ok');
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
      const webrtcUpSpan = addSpan(CONNECTION, 'janus.webrtcUp', {
        srv: this.srv,
        sessionId: this.sessionId,
        sender: json.sender,
      });
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
      pluginHandle.webrtcState(true);
      finishSpan(webrtcUpSpan, 'ok');
      return;
    }

    if (janus === 'hangup') {
      const hangupSpan = addSpan(CONNECTION, 'janus.hangup', {
        srv: this.srv,
        sessionId: this.sessionId,
        sender: json.sender,
        reason: json.reason,
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
      pluginHandle.webrtcState(false, json.reason);
      pluginHandle.hangup();
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
      const slowlinkSpan = addSpan(CONNECTION, 'janus.slowlink', {
        srv: this.srv,
        sessionId: this.sessionId,
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
      const errorSpan = addSpan(CONNECTION, 'janus.error', {
        srv: this.srv,
        sessionId: this.sessionId,
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
        finishSpan(errorSpan, 'error_response');
        transaction.reject(json);
      } else {
        finishSpan(errorSpan, 'ok');
      }
      return;
    }

    if (janus === 'event') {
      logger.debug(NAMESPACE, 'Got event', json);
      const sender = json.sender;
      const transaction = this.getTransaction(json);
      const eventSpan = addSpan(CONNECTION, 'janus.event', {
        srv: this.srv,
        sessionId: this.sessionId,
        sender,
        hasTransaction: !!transaction,
      });

      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        finishSpan(eventSpan, 'no_sender');
        return;
      }
      const pluginData = json.plugindata;
      if (pluginData === undefined || pluginData === null) {
        logger.error(NAMESPACE, 'Missing plugindata...');
        finishSpan(eventSpan, 'no_plugindata');
        return;
      }

      const data = pluginData.data;
      if (transaction) {
        if (data.error_code) {
          finishSpan(eventSpan, 'error_response');
          transaction.reject({ data, json });
        } else {
          finishSpan(eventSpan, 'ok');
          transaction.resolve({ data, json });
        }
        return;
      }

      const pluginHandle = this.findHandle(sender);
      if (!pluginHandle) {
        finishSpan(eventSpan, 'no_plugin_handle');
        return;
      }

      pluginHandle.onmessage(data, json);
      finishSpan(eventSpan, 'ok');
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
    if (handler.isDestroyed) {
      logger.debug(NAMESPACE, 'Handler was destroyed', id, handler.pluginName);
      return null;
    }
    return handler;
  };
}
