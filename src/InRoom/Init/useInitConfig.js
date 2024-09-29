import { useEffect, useState } from 'react';
import log from 'loglevel';
import { geoInfo } from '../../shared/tools';
import { GEO_IP_INFO } from '../../shared/env';
import api from '../../shared/Api';
import { useUserStore } from '../../zustand/user';
import { useMqttStore } from '../../zustand/mqtt';
import ConfigStore from '../../shared/ConfigStore';
import GxyJanus from '../../shared/janus-utils';

const useInitConfig = () => {
  const [ready, setReady] = useState();
  const { user }          = useUserStore();
  const { mqttReady }     = useMqttStore();

  useEffect(() => {
    if (!mqttReady)
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
        setReady(true);
      }).catch((err) => {
        log.error('[client] error initializing app', err);
        //this.setState({appInitError: err});
      });
    });
  }, [user, mqttReady]);

  return ready;
};

export default useInitConfig;
