import { useEffect } from 'react';
import mqtt from '../../shared/mqtt';
import log from 'loglevel';
import { useUserStore } from '../../zustand/user';
import { useMqttStore } from '../../zustand/mqtt';
//import {captureMessage} from "../../shared/sentry";

const useInitMQTT = () => {
  const { user, token }             = useUserStore();
  const { mqttReady, setMqttReady } = useMqttStore();

  useEffect(() => {
    mqtt.init({ ...user, token }, (reconnected, error) => {
      if (error) {
        log.info('[client] MQTT disconnected');
        setMqttReady(false);
        alert('- Lost Connection to Arvut System -');
      } else if (reconnected) {
        setMqttReady();
        log.info('[client] MQTT reconnected');
      } else {
        setMqttReady();

        mqtt.join('galaxy/users/notification');
        mqtt.join('galaxy/users/broadcast');
        mqtt.watch((message) => {
          log.debug('on watch MQTT', message);
        });
      }
    });
  }, [user, token]);
  return mqttReady;
};

export default useInitMQTT;
