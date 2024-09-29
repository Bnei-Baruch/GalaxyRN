import { useContext, useEffect } from 'react';
import mqtt from '../../../shared/mqtt';
import { updateSentryUser } from '../../../shared/sentry';
import { AuthContext } from '../providers/AuthProvider';
import { GlobalOptionsContext } from '../providers/GlobalOptions';
import kc from '../../../components/UserManager';

const useOnCmdData = () => {
  const { user }                   = useContext(AuthContext);
  const { cammuted }               = useContext(GlobalOptionsContext);
  const { mqttReady, setCammuted } = useContext(GlobalOptionsContext);

  useEffect(() => {
    if (mqttReady) return;

    mqtt.watch((message) => {
      handleCmdData(message);
    });

  }, [mqttReady]);

  const handleCmdData = (data) => {
    const { type, id, bitrate } = data;

    if (type === 'client-reconnect' && user.id === id) {
      window.location.reload();
    } else if (type === 'client-reload' && user.id === id) {
      window.location.reload();
    } else if (type === 'client-disconnect' && user.id === id) {
      window.location.reload();
    } else if (type === 'client-kicked' && user.id === id) {
      kc.logout();
      updateSentryUser(null);
    } else if (type === 'client-question' && user.id === id) {
      //this.handleQuestion();
    } else if (type === 'client-mute' && user.id === id) {
      //this.micMute();
    } else if (type === 'video-mute' && user.id === id) {
      setCammuted(cammuted);
    } else if (type === 'audio-out') {
      //this.handleAudioOut(data);
    } else if (type === 'reload-config') {
      //this.reloadConfig();
    } else if (type === 'client-reload-all') {
      window.location.reload();
    } else if (type === 'client-state') {
      //this.userState(data.user);
    }
  };
  return null;
};

export default useOnCmdData;
