import { useEffect } from 'react';
import log from 'loglevel';
import devices from '../shared/devices';
import { useSettingsStore } from '../zustand/settings';
import { useDevicesStore } from '../zustand/devices';

const useInitDevices = () => {
  //const { t } = useTranslation()
  const t = (str) => str;

  const { setCammuted }        = useSettingsStore();
  const { setAudio, setVideo } = useDevicesStore();

  useEffect(() => {
    console.log('useInitDevices use effect', devices);
    devices.init((media) => {
      console.log('useInitDevices devices.init', media);
      setTimeout(() => {
        if (media.audio.device) {
          setAudio(media.audio.device);
        } else {
          log.warn('[client] No left audio devices');
          //FIXME: remove it from pc?
        }
        if (!media.video.device) {
          log.warn('[client] No left video devices');
          //FIXME: remove it from pc?
        }
      }, 1000);
    }).then((data) => {
      log.info('[client] init devices: ', data);
      const { audio, video } = data;
      if (audio.error && video.error) {
        alert(t('oldClient.noInputDevices'));
        setCammuted(true);
      } else if (audio.error) {
        alert('audio device not detected');
      } else if (video.error) {
        alert(t('oldClient.videoNotDetected'));
        setCammuted(true);
      }
      setVideo(video);
      setAudio(audio);
    });
  }, []);
};

export default useInitDevices;
