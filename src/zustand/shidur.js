import { create } from "zustand";
import {
  VIDEO_240P_OPTION_VALUE,
  NO_VIDEO_OPTION_VALUE,
  audiog_options2,
  trllang,
  NOTRL_STREAM_ID,
  gxycol,
} from "../shared/consts";
import { useUserStore } from "./user";
import { useSettingsStore } from "./settings";
import GxyConfig from "../shared/janus-config";
import { JanusMqtt } from "../libs/janus-mqtt";
import log from "loglevel";
import { StreamingPlugin } from "../libs/streaming-plugin";
import { getFromStorage, setToStorage } from "../shared/tools";
import { HIDE_BARS_TIMEOUT_MS } from "./helper";
import { useInRoomStore } from "./inRoom";
import api from "../shared/Api";
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
        log.warn("[shidur] janus status: ", status);
        useInRoomStore.getState().restartRoom();
      }
    };
    const _data = await _janus.attach(janusStream);
    log.debug("[shidur] attach media", _data);
    const stream = await janusStream.watch(media);
    return [stream, janusStream];
  } catch (error) {
    log.error(
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

    await setToStorage("vrt_video", video);
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
  setAudio: async (audio, text) => {
    if (get().isOnAir) {
      const audio_option = audiog_options2.find(
        (option) => option.value === audio
      );
      const id = trllang[audio_option.eng_text];
      if (id) {
        await trlAudioJanus.switch(id);
      }
    } else {
      await audioJanus?.switch(audio);
    }
    console.log("setAudio", audio, text);
    setToStorage("vrt_lang", audio);
    if (audio !== NOTRL_STREAM_ID) setToStorage("trl_lang", audio);
    setToStorage("vrt_langtext", text);
    set({ videoStream, audio });
  },
  initJanus: async () => {
    const { user } = useUserStore.getState();
    if (janus) get().cleanShidur();

    let srv = null;
    try {
      const _userState = useUserStore.getState().buildUserState();
      console.log("[shidur] initJanus fetchStrServer", _userState);
      srv = await api.fetchStrServer(_userState).then((res) => {
        console.log("[shidur] initJanus fetchStrServer", res);
        return res?.server;
      });
    } catch (error) {
      console.error("[shidur] Error during fetchStrServer:", error);
    }

    if (!srv) {
      const gw_list = GxyConfig.gatewayNames("streaming");
      let inst = gw_list[Math.floor(Math.random() * gw_list.length)];

      config = GxyConfig.instanceConfig(inst);
      srv = config.name;
      console.log("[shidur] init build janus", inst, config);
    } else {
      config = GxyConfig.instanceConfig(srv);
    }


    console.log("[shidur] new JanusMqtt", user, srv);
    janus = new JanusMqtt(user, srv);

    /* janus.onStatus = async (srv, status) => {
      if (status !== 'online') {
        log.warn('[shidur] janus status: ', status);
        if (janus)
          await get().cleanShidur();
        janus = null;
        setTimeout(() => {
          get().initJanus(srv);
        }, 7000);
      }
    }; */
    await janus.init(config.token);
    log.debug("[shidur] init janus ready");
    set({ janusReady: true });
  },
  cleanJanus: async () => {
    if (!janus || cleanWIP) return;
    cleanWIP = true;
    try {
      get().cleanShidur();
      get().cleanQuads();
      console.log("[shidur] cleanJanus", janus);
      await janus.destroy();
      janus = null;
      set({ janusReady: false });
    } catch (error) {
      log.error("[shidur] Error during cleanJanus:", error);
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
      promises.push(
        initStream(janus, video)
          .then((res) => {
            if (!res || res.length < 2) {
              log.error("[shidur] Failed to initialize video stream");
              return false;
            }
            videoStream = res[0];
            videoJanus = res[1];
            return true;
          })
          .catch((err) => {
            log.error(
              "[shidur] Video stream initialization error",
              err?.message || JSON.stringify(err) || "undefined"
            );
            return false;
          })
      );
    }
    if (!audioJanus) {
      promises.push(
        initStream(janus, audio)
          .then((res) => {
            if (!res || res.length < 2) {
              log.error("[shidur] Failed to initialize audio stream");
              return false;
            }
            audioStream = res[0];
            audioJanus = res[1];
            return true;
          })
          .catch((err) => {
            log.error(
              "[shidur] Audio stream initialization error",
              err?.message || JSON.stringify(err) || "undefined"
            );
            return false;
          })
      );
    }
    if (!trlAudioJanus) {
      const id = await getFromStorage("vrt_langtext", "Original").then(
        (x) => trllang[x]
      );
      promises.push(
        initStream(janus, id)
          .then((res) => {
            if (!res || res.length < 2) {
              log.error(
                "[shidur] Failed to initialize translation audio stream"
              );
              return false;
            }
            trlAudioStream = res[0];
            trlAudioStream
              ?.getAudioTracks()
              ?.forEach((track) => (track.enabled = false));
            trlAudioJanus = res[1];
            return true;
          })
          .catch((err) => {
            log.error(
              "[shidur] Translation audio stream initialization error",
              err?.message || JSON.stringify(err) || "undefined"
            );
            return false;
          })
      );
    }
    console.log("[shidur] wait for ready all streams", promises.length);
    try {
      const results = await Promise.all(promises);
      if (results.some((result) => result === false)) {
        log.warn("[shidur] Some streams failed to initialize");
      }
      console.log("[shidur] streams are ready", videoStream);
      set(() => ({
        videoStream,
        audioUrl: audioStream?.toURL(),
        trlUrl: trlAudioStream?.toURL(),
        readyShidur: true,
      }));
    } catch (err) {
      console.error(
        "[shidur] stream error",
        err?.message || JSON.stringify(err) || "undefined"
      );
    }
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
    log.debug("call streamGalaxy bug: [shidur] got talk event: ", isOnAir);
    if (!trlAudioJanus) {
      log.debug(
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
      log.debug(
        "call streamGalaxy bug:[shidur] Switch audio stream: ",
        gxycol[col]
      );
      audioJanus.switch(gxycol[col]);
      const _langtext = await getFromStorage("vrt_langtext");
      const id = trllang[_langtext];
      // Don't bring translation on toggle trl stream
      if (!id) {
        log.debug("[shidur] no id in local storage or client use togle stream");
      } else {
        log.debug(
          `[shidur] Switch trl stream: langtext - ${_langtext}, id - ${id}`
        );
        await trlAudioJanus.switch(id);
      }
      audioStream?.getAudioTracks().forEach((track) => track._setVolume(0.2));
      log.debug("[shidur] You now talking");
    } else {
      log.debug("[shidur] Stop talking");
      // Bring back source if was choosen before
      const id = await getFromStorage("vrt_lang", 2).then((x) => Number(x));
      log.debug("[shidur] get stream back id: ", id);
      await audioJanus.switch(id);
      log.debug("[shidur] Switch audio stream back");
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
    if (videoJanus) {
      cleanStream(videoStream);
      videoJanus.detach();
      videoJanus = null;
      videoStream = null;
    }

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
