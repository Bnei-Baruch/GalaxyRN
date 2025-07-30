import { Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';

const NAMESPACE = 'IceConnection';

class IceConnectionMonitor {
  constructor(pc, iceFailed, janus, sendIceRestart, who) {
    this.pc = pc;
    this.iceFailed = iceFailed;
    this.netInfoUnsubscribe = null;
    this.timeout = null;
    this.janus = janus;
    this.sendIceRestart = sendIceRestart;
    this.who = who;
    this.attempts = 0;
  }

  init() {
    logger.debug(NAMESPACE, 'init', this.who);

    if (Platform.OS === 'ios') {
      this.iosInit();
    } else {
      this.androidInit();
    }
  }

  iosInit() {
    logger.debug(NAMESPACE, 'iosInit', this.who);
    try {
      const NetInfo = require('@react-native-community/netinfo');
      logger.debug(NAMESPACE, 'NetInfo loaded', this.who);
      this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
        logger.debug(NAMESPACE, 'Network state:', state, this.who);

        if (!state.isConnected) {
          logger.debug(NAMESPACE, 'Network disconnected', this.who);
          this.iceState = 'disconnected';
          this.iceRestart();
          return;
        }

        const ipAddress = state.details?.ipAddress;
        this.iceState = 'connected';
        this.attempts = 0;
        if (this.ipAddress && (!ipAddress || ipAddress !== this.ipAddress)) {
          logger.debug(
            NAMESPACE,
            'IP Address changed:',
            ipAddress,
            this.ipAddress,
            this.who
          );
          this.iceState = 'disconnected';
          this.iceRestart(true);
        }
        this.ipAddress = ipAddress;
      });
    } catch (e) {
      logger.error(NAMESPACE, 'Error in iosInit', e, this.who);
    }
  }

  androidInit() {
    logger.debug(NAMESPACE, 'androidInit', this.who);
    this.pc.addEventListener('connectionstatechange', e => {
      logger.info(
        NAMESPACE,
        'connectionstatechange: ',
        e.target.connectionState,
        this.who
      );

      this.iceState = e.target.connectionState;

      if (this.iceState === 'disconnected') {
        this.iceRestart();
      }

      // ICE restart does not help here, peer connection will be down
      if (this.iceState === 'failed') {
        logger.info(
          NAMESPACE,
          'connectionstatechange failed: ',
          this.iceState,
          this.who
        );
        this.iceFailed();
      }
      if (this.iceState === 'connected') {
        this.attempts = 0;
      }
    });
  }

  async iceRestart(force = false) {
    logger.debug(NAMESPACE, 'iceRestart', this.who);
    if (this.iceState === 'failed') {
      return;
    }

    BackgroundTimer.clearTimeout(this.timeout);
    try {
      this.timeout = BackgroundTimer.setTimeout(async () => {
        logger.debug(
          NAMESPACE,
          'ICE Restart start try: ',
          this.attempts,
          this.iceState,
          this.who
        );

        if (this.iceState !== 'disconnected' && !force) {
          logger.debug(NAMESPACE, 'ICE Restart not needed', this.who);
          return;
        }

        if (this.attempts > 10) {
          logger.debug(NAMESPACE, 'ICE Restart failed', this.who);
          this.iceFailed();
          return;
        }

        if (!this.janus?.isConnected || !mqtt.mq.connected) {
          logger.debug(NAMESPACE, 'Janus or MQTT not connected', this.who);
          this.attempts++;
          return this.iceRestart(force);
        }

        logger.debug(NAMESPACE, '- Trigger ICE Restart -', this.who);
        try {
          await this.sendIceRestart();
          if (force) {
            this.attempts = 0;
            this.iceState = 'connected';
            return;
          }
        } catch (err) {
          logger.error(NAMESPACE, 'Error during ICE restart', err, this.who);
        }

        this.attempts++;
        return this.iceRestart();
      }, 1000);
    } catch (e) {
      logger.error(NAMESPACE, 'Error in iceRestart', e, this.who);
    }
  }

  remove() {
    logger.debug(NAMESPACE, 'remove');
    if (this.timeout) {
      this.attempts = 0;
      BackgroundTimer.clearTimeout(this.timeout);
    }
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }
  }
}

export default IceConnectionMonitor;
