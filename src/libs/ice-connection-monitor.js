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
  }

  init() {
    logger.debug(NAMESPACE, 'init', this.who);
    this.pc.addEventListener('connectionstatechange', e => {
      logger.info(NAMESPACE, 'ICE State: ', e.target.connectionState);
      this.iceState = e.target.connectionState;
      if (this.iceState === 'disconnected') {
        this.iceRestart();
      }

      // ICE restart does not help here, peer connection will be down
      if (this.iceState === 'failed') {
        logger.info(NAMESPACE, 'ICE State: ', this.iceState);
        this.iceFailed();
      }
    });
    if (Platform.OS === 'ios') {
      this.iosInit();
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
        if (this.ipAddress && (!ipAddress || ipAddress !== this.ipAddress)) {
          logger.debug(
            NAMESPACE,
            'IP Address changed:',
            ipAddress,
            this.ipAddress,
            this.who
          );
          this.iceState = 'disconnected';
          this.iceRestart();
        } else {
          this.iceState = 'connected';
        }
        this.ipAddress = ipAddress;
      });
    } catch (e) {
      logger.error(NAMESPACE, 'Error in iosInit', e, this.who);
    }

    this.pc.addEventListener('iceconnectionstatechange', e => {
      logger.info(NAMESPACE, 'ICE State: ', e.target.connectionState, this.who);
      this.iceState = e.target.connectionState;
      if (this.iceState === 'disconnected') {
        this.iceRestart();
      }

      // ICE restart does not help here, peer connection will be down
      if (this.iceState === 'failed') {
        logger.info(NAMESPACE, 'ICE State: ', this.iceState, this.who);
        this.iceFailed();
      }
    });
  }

  async iceRestart(attempt = 0) {
    logger.debug(NAMESPACE, 'iceRestart', this.who);
    if (this.iceState === 'failed') {
      return;
    }

    logger.debug(
      NAMESPACE,
      'ICE Restart start try: ',
      attempt,
      this.iceState,
      this.who
    );
    BackgroundTimer.clearTimeout(this.timeout);
    try {
      this.timeout = BackgroundTimer.setTimeout(async () => {
        logger.debug(
          NAMESPACE,
          'ICE Restart start try: ',
          attempt,
          this.iceState,
          this.who
        );

        if (this.iceState !== 'disconnected') {
          return;
        }

        if (attempt > 10) {
          this.iceFailed();
          return;
        }

        if (!this.janus?.isConnected || !mqtt.mq.connected) {
          logger.debug(NAMESPACE, 'Janus or MQTT not connected', this.who);
          return this.iceRestart(attempt + 1);
        }

        logger.debug(NAMESPACE, '- Trigger ICE Restart -');
        try {
          await this.sendIceRestart();
        } catch (err) {
          logger.error(NAMESPACE, 'Error during ICE restart', err);
        }

        return this.iceRestart(attempt + 1);
      }, 1000);
    } catch (e) {
      logger.error(
        NAMESPACE,
        'Error in iceRestart',
        e?.message || JSON.stringify(e) || 'undefined'
      );
    }
  }

  remove() {
    logger.debug(NAMESPACE, 'remove');
    if (this.timeout) {
      BackgroundTimer.clearTimeout(this.timeout);
    }
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }
  }
}

export default IceConnectionMonitor;
