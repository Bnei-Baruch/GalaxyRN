import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';
import { randomString } from '../shared/tools';
import { netIsConnected } from './connection-monitor';

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
    this.onMessage = this.onMessage.bind(this);
    this.keepAlive = this.keepAlive.bind(this);
    this.isJanusInitialized = false;
    this.clearKeepAliveTimer = this.clearKeepAliveTimer.bind(this);
    this.setKeepAliveTimer = this.setKeepAliveTimer.bind(this);
    this.keepAliveTimer = null;
  }

  async init(token) {
    this.token = token;
    logger.debug(NAMESPACE, 'janus-mqtt init this.user', this.user);
    try {
      await mqtt.sub(this.rxTopic + '/' + this.user.id, 0);
      await mqtt.sub(this.rxTopic, 0);
      await mqtt.sub(this.stTopic, 1);
    } catch (error) {
      logger.error(NAMESPACE, 'Error subscribing to MQTT topics:', error);
      throw error;
    }
    logger.debug(NAMESPACE, 'janus-mqtt init this.srv', this.srv);
    mqtt.mq.on(this.srv, this.onMessage);

    const transaction = randomString(12);
    const msg = { janus: 'create', transaction, token };

    this.connect = () => {
      logger.debug(NAMESPACE, 'janus-mqtt connect', this.isJanusInitialized);
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
  }

  disconnect(json) {
    logger.debug(NAMESPACE, 'janus-mqtt disconnect', json);
    this._cleanupTransactions();
  }

  attach(plugin) {
    logger.debug(NAMESPACE, 'janus-mqtt attach', plugin);
    const name = plugin.getPluginName();
    return this.transaction(
      'attach',
      { plugin: name, opaque_id: this.user.id },
      'success'
    ).then(json => {
      if (json.janus !== 'success') {
        logger.error(NAMESPACE, 'Cannot add plugin', json);
        plugin.error(json);
        throw new Error(json);
      }

      this.pluginHandles[json.data.id] = plugin;

      return plugin.success(this, json.data.id);
    });
  }

  destroy() {
    logger.debug(NAMESPACE, 'janus-mqtt destroy');
    if (!this.isConnected) {
      this.clearKeepAliveTimer();
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this._cleanupPlugins().then(() => {
        return this.transaction('destroy', {}, 'success', 5000)
          .then(data => {
            logger.debug(NAMESPACE, 'Janus destroyed: ', data);
            this._cleanupTransactions();
            resolve();
          })
          .catch(err => {
            logger.debug(NAMESPACE, 'destroy err', JSON.stringify(err));
            this._cleanupTransactions();
            resolve();
          })
          .finally(() => {
            this.clearKeepAliveTimer();
          });
      });
    });
  }

  detach(plugin) {
    logger.debug(
      NAMESPACE,
      'detach plugin',
      plugin,
      Object.keys(this.pluginHandles)
    );
    return new Promise((resolve, reject) => {
      if (!this.pluginHandles[plugin.janusHandleId]) {
        reject(new Error('unknown plugin'));
        return;
      }

      this.transaction(
        'hangup',
        {
          plugin: plugin.pluginName,
          handle_id: plugin.janusHandleId,
        },
        'success',
        5000
      )
        .then(() => {
          delete this.pluginHandles[plugin.janusHandleId];
          plugin.detach();

          resolve();
        })
        .catch(err => {
          delete this.pluginHandles[plugin.janusHandleId];
          plugin.detach();

          reject(err);
        });
    });
  }

  transaction(type, payload, replyType = 'ack', timeoutMs) {
    logger.debug(
      NAMESPACE,
      'janus-mqtt transaction',
      type,
      payload,
      replyType,
      timeoutMs
    );
    const transactionId = randomString(12);
    return new Promise((resolve, reject) => {
      logger.debug(NAMESPACE, 'janus-mqtt transaction promise', transactionId);
      if (!this.isConnected || !netIsConnected()) {
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
              logger.debug(
                NAMESPACE,
                'janus-mqtt transaction timeout',
                this.transactions[transactionId]
              );
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
          'janus-mqtt transaction request',
          Object.keys(this.transactions)
        );
        // Check MQTT connection
        if (!mqtt.mq || !mqtt.mq.connected) {
          logger.warn(
            NAMESPACE,
            'MQTT not connected when trying to send transaction'
          );
          return reject(new Error('MQTT connection unavailable'));
        }

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
  }

  keepAlive() {
    logger.debug(NAMESPACE, 'keepAlive tick', this.keeptry);
    if (!this.isConnected || !this.sessionId || !netIsConnected()) {
      this.setKeepAliveTimer(this.keepAlive);
      return;
    }

    logger.debug(NAMESPACE, `Sending keepalive to: ${this.srv}`);
    this.transaction('keepalive', null, 'ack', 20 * 1000)
      .then(() => {
        logger.debug(NAMESPACE, 'keepalive sent');
        this.keeptry = 0;
        this.setKeepAliveTimer(this.keepAlive);
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
        this.setKeepAliveTimer(this.keepAlive);
        this.keeptry++;
      });
  }

  getTransaction(json, ignoreReplyType = false) {
    logger.debug(NAMESPACE, 'janus-mqtt getTransaction', json, ignoreReplyType);
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
  }

  onClose() {
    logger.debug(NAMESPACE, 'janus-mqtt onClose');
    if (!this.isConnected) {
      this.clearKeepAliveTimer();
      return;
    }

    this.isConnected = false;
    logger.error(NAMESPACE, 'Lost connection to the gateway (is it down?)');
  }

  _cleanupPlugins() {
    logger.debug(NAMESPACE, 'janus-mqtt _cleanupPlugins');
    const arr = [];
    Object.keys(this.pluginHandles).forEach(pluginId => {
      const plugin = this.pluginHandles[pluginId];
      //delete this.pluginHandles[pluginId]
      logger.debug(NAMESPACE, '_cleanupPlugins ', plugin, pluginId);
      arr.push(
        new Promise((resolve, reject) => {
          if (!this.pluginHandles[plugin.janusHandleId]) {
            reject(new Error('unknown plugin'));
            return;
          }

          this.transaction(
            'hangup',
            {
              plugin: plugin.pluginName,
              handle_id: plugin.janusHandleId,
            },
            'success',
            1000
          )
            .then(() => {
              delete this.pluginHandles[plugin.janusHandleId];
              plugin.detach();

              resolve();
            })
            .catch(err => {
              logger.debug(
                NAMESPACE,
                '_cleanupPlugins err',
                plugin.pluginName,
                err
              );
              delete this.pluginHandles[plugin.janusHandleId];
              plugin.detach();

              reject(err);
            });
        })
      );
    });
    return Promise.allSettled(arr);
  }

  async _cleanupTransactions() {
    logger.debug(NAMESPACE, 'janus-mqtt _cleanupTransactions');
    Object.keys(this.transactions).forEach(transactionId => {
      const transaction = this.transactions[transactionId];
      if (transaction.reject) {
        transaction.reject();
      }
    });
    this.transactions = {};
    this.sessionId = null;
    this.isConnected = false;

    try {
      await mqtt.exit(this.rxTopic + '/' + this.user.id);
      await mqtt.exit(this.rxTopic);
      await mqtt.exit(this.stTopic);
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
  }

  onMessage(message, tD) {
    let json;
    try {
      json = JSON.parse(message);
    } catch (err) {
      logger.error(
        NAMESPACE,
        'Cannot parse message',
        message?.data || message || 'undefined',
        err
      );
      return;
    }

    logger.debug(NAMESPACE, 'On message: ', json, tD);
    const { session_id, janus, data, jsep } = json;

    if (tD === 'status' && json.online) {
      logger.debug(NAMESPACE, `Janus Server - ${this.srv} - Online`);
      this.connect();
      return;
    }

    if (tD === 'status' && !json.online) {
      this.isConnected = false;
      logger.debug(NAMESPACE, `Janus Server - ${this.srv} - Offline`);
      this.disconnect(json);
      useInRoomStore.getState().exitRoom();
      alert('Janus Server - ' + this.srv + ' - Offline');
      return;
    }

    if (janus === 'keepalive') {
      // Do nothing
      return;
    }

    if (janus === 'ack') {
      // Just an ack, we can probably ignore
      const transaction = this.getTransaction(json);
      logger.debug(NAMESPACE, 'janus ack', transaction);
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

      const pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        logger.debug(
          NAMESPACE,
          `This handle is not attached to this session ${json}`
        );
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
      const pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        logger.debug(
          NAMESPACE,
          `This handle is not attached to this session ${sender}`
        );
        return;
      }
      pluginHandle.webrtcState(true);
      return;
    }

    if (janus === 'hangup') {
      // A plugin asked the core to hangup a PeerConnection on one of our handles
      const sender = json.sender;
      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        return;
      }
      const pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        logger.debug(
          NAMESPACE,
          `This handle is not attached to this session ${sender}`
        );
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
      // Media started/stopped flowing
      const sender = json.sender;
      if (!sender) {
        logger.warn(NAMESPACE, 'Missing sender...');
        return;
      }
      const pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        logger.debug(
          NAMESPACE,
          `This handle is not attached to this session ${sender}`
        );
        return;
      }
      pluginHandle.mediaState(json.type, json.receiving);
      return;
    }

    if (janus === 'slowlink') {
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
      const pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        logger.debug(
          NAMESPACE,
          `This handle is not attached to this session ${sender}`
        );
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

      const pluginHandle = this.pluginHandles[sender];
      if (!pluginHandle) {
        logger.debug(
          NAMESPACE,
          `This handle is not attached to this session ${sender}`
        );
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

      pluginHandle.onmessage(data, json);
      return;
    }

    logger.warn(
      NAMESPACE,
      `Unknown message/event ${janus} on session ${this.sessionId}`
    );
  }

  clearKeepAliveTimer() {
    if (this.keepAliveTimer) {
      BackgroundTimer.clearTimeout(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  setKeepAliveTimer(ms = 20 * 1000) {
    this.clearKeepAliveTimer();
    this.keepAliveTimer = BackgroundTimer.setTimeout(() => {
      logger.debug(NAMESPACE, 'keepAliveTimer tick');
      this.keepAlive();
    }, ms);
  }
}
