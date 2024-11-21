import { useEffect } from 'react';
import mqtt from '../shared/mqtt';
import { useSettingsStore } from '../zustand/settings';
import { useUserStore } from '../zustand/user';
import { useMyStreamStore } from '../zustand/myStream';
import { useShidurStore } from '../zustand/shidur';

const useOnCmdData = () => {
  const { user, setUser }             = useUserStore();
  const { toggleCammute, toggleMute } = useMyStreamStore();
  const { streamGalaxy }              = useShidurStore();
  const { mqttReady, toggleQuestion } = useSettingsStore();

  useEffect(() => {
    if (mqttReady) return;

    mqtt.watch(data => {
      const { type, id, bitrate } = data;

      if (user.id === id && ['client-reconnect', 'client-reload', 'client-disconnect'].includes(type)) {
        useSettingsStore().setReadyForJoin(false);
      } else if (type === 'client-kicked' && user.id === id) {
        setUser(null);
      } else if (type === 'client-question' && user.id === id) {
        toggleQuestion();
      } else if (type === 'client-mute' && user.id === id) {
        toggleMute();
      } else if (type === 'video-mute' && user.id === id) {
        toggleCammute();
      } else if (type === 'audio-out') {
        streamGalaxy(data.status);
        if (data.status) {
          // remove question mark when sndman unmute our room
          toggleQuestion(false);
        }
      } else if (type === 'reload-config') {
        //this.reloadConfig();
      } else if (type === 'client-reload-all') {
        window.location.reload();
      } else if (type === 'client-state') {
        //this.userState(data.user);
      }

    });

  }, [mqttReady]);

  return null;
};

export default useOnCmdData;
