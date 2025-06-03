import { create } from "zustand";
import {
  VIDEO_240P_OPTION_VALUE,
  NO_VIDEO_OPTION_VALUE,
  audio_options2,
  trllang,
  NOTRL_STREAM_ID,
  gxycol,
} from "../shared/consts";
import { useUserStore } from "./user";
import { useSettingsStore } from "./settings";
import GxyConfig from "../shared/janus-config";
import { JanusMqtt } from "../libs/janus-mqtt";
import { debug, info, warn, error } from "../services/logger";
import { StreamingPlugin } from "../libs/streaming-plugin";
import { getFromStorage, setToStorage } from "../shared/tools";
import { HIDE_BARS_TIMEOUT_MS } from "./helper";
import { useInRoomStore } from "./inRoom";
import api from "../shared/Api";

const NAMESPACE = 'Shidur';

let janus = null;
let cleanWIP = false;
let quadJanus = null;
let quadStream = null;

// Streaming plugin for video.
let videoJanus = null;
let videoStream = null;

// Streaming plugin for audio.
let audioJanus = null;
let audioStream = null;

// Streaming plugin for trlAudio
let trlAudioJanus = null;
let trlAudioStream = null;

let config = null;

let shidurBarTimeout;
const initStream = async (_janus, media) => {
  if (!_janus) return [];
  try {
    const janusStream = new StreamingPlugin(config?.iceServers);
    janusStream.onStatus = async (srv, status) => {
      if (status !== "online") {
        warn(NAMESPACE, "[shidur] janus status: ", status);
        useInRoomStore.getState().restartRoom();
      }
    };
    const _data = await _janus.attach(janusStream);
    debug(NAMESPACE, "[shidur] attach media", _data);
    const stream = await janusStream.watch(media);
    return [stream, janusStream];
  } catch (error) {
    error(NAMESPACE, 
      "[shidur] stream error",
      error?.message || JSON.stringify(error) || "undefined"
    );
    return [];
  }
};

const cleanStream = (stream) =>
  stream?.getTracks().forEach((track) => track.stop());

export const useShidurStore = create((set, get) => ({
  video: VIDEO_240P_OPTION_VALUE,
  audio: 64,
  langtext: "Original",
  videoStream: null,
  quadUrl: null,
  trlUrl: null,
  audioUrl: null,
  readyShidur: false,
  isOnAir: false,
  isPlay: false,
  janusReady: false,
  isMuted: false,
  isAutoPlay: false,
  setIsMuted: (isMuted = !get().isMuted) => {
    [
      ...(audioStream?.getAudioTracks() || []),
      ...(trlAudioStream?.getAudioTracks() || []),
    ].forEach((t) => {
      t.enabled = !isMuted;
      !isMuted && t._setVolume(0.8);
    });
    set({ isMuted });
  },
  setVideo: async (video, updateState = true) => {
    if (!janus) return;
    if (updateState) {
      await setToStorage("vrt_video", video);
    }
    if (video === NO_VIDEO_OPTION_VALUE) {
      if (videoJanus !== null) {
        cleanStream(videoStream);
        videoStream = null;
        videoJanus.detach();
        videoJanus = null;
      }
    } else {
      if (videoJanus) {
        await videoJanus.switch(video);
      } else {
        await get().initShidur();
      }
    }

    set({ videoStream, video });
  },
  setAudio: async (audio, langtext) => {
    if (get().isOnAir) {
      const audio_option = audio_options2.find(
        (option) => option.value === audio
      );
      const id = trllang[audio_option.eng_text];
      if (id) {
        await trlAudioJanus.switch(id);
      }
    } else {
      await audioJanus?.switch(audio);
    }
    debug(NAMESPACE, "setAudio", audio, langtext);
    setToStorage("vrt_lang", audio);
    if (audio !== NOTRL_STREAM_ID) setToStorage("trl_lang", audio);
    setToStorage("vrt_langtext", langtext);
    set({ videoStream, audio, langtext });
  },
  initJanus: async () => {
    const { user } = useUserStore.getState();
    if (janus) get().cleanShidur();

    let srv = null;
    try {
      const _userState = useUserStore.getState().buildUserState();
      debug(NAMESPACE, "initJanus fetchStrServer", _userState);
      srv = await api.fetchStrServer(_userState).then((res) => {
        debug(NAMESPACE, "initJanus fetchStrServer", res);
        return res?.server;
      });
    } catch (error) {
      error(NAMESPACE, "Error during fetchStrServer:", error);
    }

    if (!srv) {
      const gw_list = GxyConfig.gatewayNames("streaming");
      let inst = gw_list[Math.floor(Math.random() * gw_list.length)];

      config = GxyConfig.instanceConfig(inst);
      srv = config.name;
      debug(NAMESPACE, "init build janus", inst, config);
    } else {
      config = GxyConfig.instanceConfig(srv);
    }

    debug(NAMESPACE, "new JanusMqtt", user, srv);
    janus = new JanusMqtt(user, srv);

    await janus.init(config.token);
    debug(NAMESPACE, "init janus ready");
    set({ janusReady: true });
  },
  cleanJanus: async () => {
    if (!janus || cleanWIP) return;
    cleanWIP = true;
    try {
      get().cleanShidur();
      get().cleanQuads();
      debug(NAMESPACE, "cleanJanus", janus);
      await janus.destroy();
      janus = null;
      set({ janusReady: false });
    } catch (error) {
      error(NAMESPACE, "Error during cleanJanus:", error);
    }
    cleanWIP = false;
  },
  initShidur: async (isPlay = get().isPlay) => {
    if (!useSettingsStore.getState().isShidur || !isPlay) return;

    const video = await getFromStorage("vrt_video", 1).then((x) => Number(x));
    const audio = await getFromStorage("vrt_lang", 2).then((x) => Number(x));

    set({ video, audio });

    const promises = [];
    if (!videoJanus && video !== NO_VIDEO_OPTION_VALUE) {
      promises.push(initStream(janus, video));
    }
    if (!audioJanus) {
      promises.push(initStream(janus, audio));
    }

    debug(NAMESPACE, "wait for ready all streams", promises.length);
    const results = await Promise.all(promises);

    for (const [stream, janusStream] of results) {
      if (stream?.getVideoTracks().length > 0) {
        videoStream = stream;
        videoJanus = janusStream;
      } else if (stream?.getAudioTracks().length > 0) {
        audioStream = stream;
        audioJanus = janusStream;
      }
    }

    debug(NAMESPACE, "streams are ready", videoStream);
    set({ videoStream, readyShidur: true });
  },
  cleanShidur: () => {
    cleanStream(videoStream);
    videoStream = null;
    videoJanus?.detach();
    videoJanus = null;

    cleanStream(audioStream);
    audioStream = null;
    audioJanus?.detach();
    audioJanus = null;

    cleanStream(trlAudioStream);
    trlAudioStream = null;
    trlAudioJanus?.detach();
    trlAudioJanus = null;

    set({
      readyShidur: false,
      isPlay: false,
      videoStream: null,
      isOnAir: null,
    });
  },
  streamGalaxy: async (isOnAir) => {
    debug(NAMESPACE, "call streamGalaxy bug: [shidur] got talk event: ", isOnAir);
    if (!trlAudioJanus) {
      debug(NAMESPACE, 
        "call streamGalaxy bug:[shidur] look like we got talk event before stream init finished"
      );
      setTimeout(() => {
        get().streamGalaxy(isOnAir);
      }, 1000);
      return;
    }

    if (isOnAir) {
      // Switch to -1 stream
      const col = 4;
      debug(NAMESPACE, 
        "call streamGalaxy bug:[shidur] Switch audio stream: ",
        gxycol[col]
      );
      audioJanus.switch(gxycol[col]);
      const _langtext = await getFromStorage("vrt_langtext");
      const id = trllang[_langtext];
      // Don't bring translation on toggle trl stream
      if (!id) {
        debug(NAMESPACE, "[shidur] no id in local storage or client use togle stream");
      } else {
        debug(NAMESPACE, 
          `[shidur] Switch trl stream: langtext - ${_langtext}, id - ${id}`
        );
        await trlAudioJanus.switch(id);
      }
      audioStream?.getAudioTracks().forEach((track) => track._setVolume(0.2));
      debug(NAMESPACE, "[shidur] You now talking");
    } else {
      debug(NAMESPACE, "[shidur] Stop talking");
      // Bring back source if was choosen before
      const id = await getFromStorage("vrt_lang", 2).then((x) => Number(x));
      debug(NAMESPACE, "[shidur] get stream back id: ", id);
      await audioJanus.switch(id);
      debug(NAMESPACE, "[shidur] Switch audio stream back");
      audioStream?.getAudioTracks().forEach((track) => track._setVolume(0.8));
    }
    trlAudioStream
      ?.getAudioTracks()
      ?.forEach((track) => (track.enabled = isOnAir));
    set({ isOnAir });
  },
  toggleIsPlay: async (isPlay = !get().isPlay) => {
    const { initShidur, readyShidur, isMuted } = get();
    if (!readyShidur) {
      await initShidur(isPlay);
    }

    videoStream?.getVideoTracks().forEach((t) => (t.enabled = isPlay));
    [
      ...audioStream?.getAudioTracks(),
      ...trlAudioStream?.getAudioTracks(),
    ].forEach((t) => (t.enabled = isPlay && !isMuted));
    set({ isPlay });
  },
  initQuad: async () => {
    if (quadStream) return;
    const [stream, janusStream] = await initStream(janus, 102);
    set({ quadUrl: stream.toURL(), isQuad: true });
    quadStream = stream;
    quadJanus = janusStream;
  },
  cleanQuads: (updateState = true) => {
    cleanStream(quadStream);
    quadStream = null;
    quadJanus?.detach();
    quadJanus = null;

    if (updateState) set({ quadUrl: null, isQuad: false });
    else set({ quadUrl: null });
  },
  enterAudioMode: () => {
    get().setVideo(NO_VIDEO_OPTION_VALUE, false);

    if (trlAudioJanus) {
      cleanStream(trlAudioStream);
      trlAudioJanus.detach();
      trlAudioJanus = null;
      trlAudioStream = null;
    }
    set({ videoStream, trlUrl: null });
  },
  shidurBar: true,
  toggleShidurBar: (hideOnTimeout = true, shidurBar = !get().shidurBar) => {
    clearTimeout(shidurBarTimeout);
    if (hideOnTimeout) {
      shidurBarTimeout = setTimeout(
        () => set({ shidurBar: false }),
        HIDE_BARS_TIMEOUT_MS
      );
    }
    set({ shidurBar });
  },
  setAutoPlay: (isAutoPlay) => set({ isAutoPlay }),
}));
