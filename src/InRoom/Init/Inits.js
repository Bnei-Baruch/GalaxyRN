import useInitMQTT from './useInitMQTT';
import useInitConfig from './useInitConfig';
//import useInitDevices from "./useInitDevices";

const Inits = ({ children }) => {
  const mqttReady   = useInitMQTT();
  const configReady = useInitConfig();
  //useInitDevices()
  //useInitJanus()
  return (
    mqttReady && configReady ? children : null
  );
};

export default Inits;
