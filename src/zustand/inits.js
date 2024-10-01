import { create } from 'zustand';
import mqtt from '../shared/mqtt';
import log from 'loglevel';
import { useUserStore } from './user';
import { geoInfo } from '../shared/tools';
import { GEO_IP_INFO } from '../shared/env';
import api from '../shared/Api';
import ConfigStore from '../shared/ConfigStore';
import GxyJanus from '../shared/janus-utils';

export const useInitsStore = create((set) => ({
  mqttReady  : false,
  configReady: false,
  initMQTT   : () => {
    const { user, token } = useUserStore.getState();

    mqtt.init({ ...user, token }, (reconnected, error) => {
      if (error) {
        log.info('[client] MQTT disconnected');
        set(() => ({ mqttReady: false }));
        alert('- Lost Connection to Arvut System -');
      } else if (reconnected) {
        set(() => ({ mqttReady: true }));
        log.info('[client] MQTT reconnected');
      } else {
        set(() => ({ mqttReady: true }));

        mqtt.join('galaxy/users/notification');
        mqtt.join('galaxy/users/broadcast');
        mqtt.watch((message) => {
          log.debug('on watch MQTT', message);
        });
      }
    });
  },
  initConfig : () => {
    if (!useInitsStore.getState().mqttReady)
      return;
    const userInfo = {};
    geoInfo(`${GEO_IP_INFO}`, (data) => {
      userInfo.ip      = data && data.ip ? data.ip : '127.0.0.1';
      userInfo.country = data && data.country ? data.country : 'XX';

      //setUserInfo(userInfo)

      api.fetchConfig().then((data) => {
        log.debug('[client] got config: ', data);
        ConfigStore.setGlobalConfig(data);
        /*
        const premodStatus = ConfigStore.dynamicConfig(ConfigStore.PRE_MODERATION_KEY) === "true";
        this.setState({premodStatus});
        */
        GxyJanus.setGlobalConfig(data);
        set(() => ({ configReady: true }));
      }).catch((err) => {
        log.error('[client] error initializing app', err);
        //this.setState({appInitError: err});
      });
    });
  }
}));