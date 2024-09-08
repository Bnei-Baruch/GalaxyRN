import {useContext, useEffect} from "react";
import log from "loglevel";
import {AuthContext} from "../providers/AuthProvider";
import {GlobalOptionsContext} from "../providers/GlobalOptions";
import {geoInfo} from "../../../shared/tools";
import {GEO_IP_INFO} from "../../../shared/env";
import api from "../../../shared/Api";
import ConfigStore from "../../../shared/ConfigStore";
import GxyJanus from "../../../shared/janus-utils";

const useInitConfig = () => {
  const {user, setUserInfo} = useContext(AuthContext);
  const {mqttReady} = useContext(GlobalOptionsContext);

  useEffect(() => {
    if (!mqttReady)
      return
    const userInfo = {}
    geoInfo(`${GEO_IP_INFO}`, (data) => {
      userInfo.ip = data && data.ip ? data.ip : "127.0.0.1";
      userInfo.country = data && data.country ? data.country : "XX";

      setUserInfo(userInfo);

      api.fetchConfig().then((data) => {
        log.debug("[client] got config: ", data);
        ConfigStore.setGlobalConfig(data);
        /*
        const premodStatus = ConfigStore.dynamicConfig(ConfigStore.PRE_MODERATION_KEY) === "true";
        this.setState({premodStatus});
        */
        GxyJanus.setGlobalConfig(data);
      }).catch((err) => {
        log.error("[client] error initializing app", err);
        //this.setState({appInitError: err});
      });
    });
  }, [user, mqttReady]);
}

export default useInitConfig;
