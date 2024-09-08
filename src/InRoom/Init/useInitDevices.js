import {useContext, useEffect} from "react";
import log from "loglevel";
import {useTranslation} from "react-i18next";

import {GlobalOptionsContext} from "../providers/GlobalOptions";
import devices from "../../../lib/devices";

const useInitDevices = () => {
  const {t} = useTranslation();

  const {setAudioDevice, setVideoDevice, setCammuted} = useContext(GlobalOptionsContext);
  useEffect(() => {
    devices.init((media) => {
      setTimeout(() => {
        if (media.audio.device) {
          setAudioDevice(media.audio.device);
        } else {
          log.warn("[client] No left audio devices");
          //FIXME: remove it from pc?
        }
        if (!media.video.device) {
          log.warn("[client] No left video devices");
          //FIXME: remove it from pc?
        }
      }, 1000);
    }).then((data) => {
      log.info("[client] init devices: ", data);
      const {audio, video} = data;
      if (audio.error && video.error) {
        alert(t("oldClient.noInputDevices"));
        setCammuted(true);
      } else if (audio.error) {
        alert("audio device not detected");
      } else if (video.error) {
        alert(t("oldClient.videoNotDetected"));
        setCammuted(true);
      }
      setVideoDevice(video)
      setAudioDevice(audio)
    });
  }, []);
}

export default useInitDevices;
