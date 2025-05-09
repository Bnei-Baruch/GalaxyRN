import { create } from "zustand";
import { JanusMqtt } from "../libs/janus-mqtt";
import GxyConfig from "../shared/janus-config";
import { PublisherPlugin } from "../libs/publisher-plugin";
import { SubscriberPlugin } from "../libs/subscriber-plugin";
import log from "loglevel";
import { userRolesEnum } from "../shared/enums";
import produce from "immer";
import { useUserStore } from "./user";
import useRoomStore from "./fetchRooms";
import { useSettingsStore } from "./settings";
import mqtt from "../shared/mqtt";
import { useMyStreamStore, getStream } from "./myStream";
import i18n from "../i18n/i18n";
import { useInitsStore } from "./inits";
import { useShidurStore } from "./shidur";
import { deepClone } from "../shared/tools";
import { useUiActions } from "./uiActions";
import { sleep } from "../shared/tools";
import useAudioDevicesStore from "./audioDevices";
import WakeLockBridge from "../services/WakeLockBridge";
import AudioBridge from "../services/AudioBridge";

let subscriber = null;
let videoroom = null;
let janus = null;

let attempts = 0;
let restartWIP = false;
let exitWIP = false;

const isVideoStream = (s) => s?.type === "video" && s.codec === "h264";

export const useInRoomStore = create((set, get) => ({
  feedById: {},
  joinRoom: async () => {
    try {
      await AudioBridge.requestAudioFocus();
      await WakeLockBridge.keepScreenOn();
      useAudioDevicesStore.getState().initAudioDevices();
      useMyStreamStore.getState().toggleMute(true);
    } catch (error) {
      console.error("Error requesting audio focus or keeping screen on", error);
      return get().exitRoom();
    }

    attempts++;
    if (attempts > 5) {
      get().exitRoom();
      alert("Could not connect to the server, please try again later");
      return;
    }
    if (janus) {
      await janus.destroy();
      janus = null;
    }
    const { user } = useUserStore.getState();
    const { room } = useRoomStore.getState();
    const { cammute, setTimestmap } = useMyStreamStore.getState();

    setTimestmap();
    let _subscriberJoined = false;

    const makeSubscription = async (pubs) => {
      const { audioMode } = useSettingsStore.getState();

      const feedById = deepClone(get().feedById);
      const subs = [];
      const unsubs = [];

      for (const pub of pubs) {
        const { id, display } = pub;

        if (!pub.streams) {
          unsubs.push({ feed: id });
          feedById[id] && delete feedById[id];
          continue;
        }

        const avStreams = pub.streams.filter(
          (s) =>
            (!audioMode && isVideoStream(s)) ||
            (s.type === "audio" && s.codec === "opus")
        );

        avStreams.forEach((s) => {
          const _data = { feed: id, mid: s.mid };
          if (isVideoStream(s)) {
            s.disabled ? unsubs.push(_data) : subs.push(_data);
            return;
          }

          if (!feedById[id]) subs.push(_data);
        });

        const vStream = avStreams
          .filter(isVideoStream)
          .find((s) => !s.disabled);
        // dont rewrite feedById[id] was get from mqtt
        if (!feedById[id]) {
          feedById[id] = { id, display: JSON.parse(display), camera: !!vStream };
        }
        vStream && (feedById[id].vMid = vStream.mid);
      }

      if (_subscriberJoined) {
        set({ feedById });

        if (subs.length > 0) await subscriber.sub(subs);

        if (unsubs.length > 0) await subscriber.unsub(subs);

        return;
      }

      if (subs.length === 0) return;

      await subscriber.join(subs, room.room);
      set({ feedById });
      _subscriberJoined = true;
      return subs.map((s) => s.feed);
    };

    const config = GxyConfig.instanceConfig(room.janus);
    console.log("useInRoomStore joinRoom config", config);
    janus = new JanusMqtt(user, config.name);
    janus.onStatus = (srv, status) => {
      if (status === "offline") {
        alert("Janus Server - " + srv + " - Offline");
        get().exitRoom();
        return;
      }

      if (status === "error") {
        console.error("[client] Janus error, reconnecting...");
        get().restartRoom();
      }
    };

    /**
     * publish my video stream to the room
     */
    videoroom = new PublisherPlugin(config.iceServers);
    videoroom.subTo = (pubs) =>
      makeSubscription(pubs).then(() => {
        useUserStore.getState().sendUserState();
        useUiActions.getState().updateWidth();
      });

    videoroom.unsubFrom = async (ids) => {
      const params = [];
      ids.forEach((id) => {
        const feed = get().feedById[id];
        if (!feed) return;

        params.push({ feed: parseInt(feed.id) });
        log.info(
          "[client] Feed " +
            JSON.stringify(feed) +
            " (" +
            feed.id +
            ") has left the room, detaching"
        );
      });

      videoroom.iceFailed = async () => {
        get().restartRoom();
      };
      // Send an unsubscribe request.
      if (_subscriberJoined && params.length > 0) {
        await subscriber.unsub(params);
      }

      set(
        produce((state) => {
          ids.forEach((id) => {
            state.feedById[id] && delete state.feedById[id];
          });
        })
      );

      useUiActions.getState().updateWidth();
    };
    videoroom.talkEvent = (id, talking) => {
      set(
        produce((state) => {
          if (state.feedById[id]) state.feedById[id].talking = talking;
        })
      );
    };

    /**
     * subscribe to members of the room
     */
    subscriber = new SubscriberPlugin(config.iceServers);
    subscriber.onTrack = (track, stream, on) => {
      const { id } = stream;
      log.info(
        "[client] >> This track is coming from feed " + id + ":",
        track.id,
        track,
        stream
      );
      if (on) {
        if (track.kind === "video") {
          set(
            produce((state) => {
              state.feedById[id].url = stream.toURL();
            })
          );
        }
      }
    };

    subscriber.onUpdate = (streams) => {
      if (!streams) return;

      const _videosByFeed = {};
      for (const s of streams) {
        if (s.type !== "video" || !s.active) continue;
        _videosByFeed[s.feed_id] = s;
      }
      log.debug("[client] Updated _videosByFeed", _videosByFeed);
      set(
        produce((state) => {
          for (const k in state.feedById) {
            const f = state.feedById[k];
            if (!_videosByFeed[f.id]) {
              f.url = undefined;
            }
          }
        })
      );
    };

    subscriber.iceFailed = async () => {
      log.warn("[subscriber] iceFailed");
      get().restartRoom();
    };

    janus
      .init(config.token)
      .then((data) => {
        console.log("[client] joinRoom on janus.init", data);
        janus.attach(videoroom).then((data) => {
          console.info("[client] Publisher Handle: ", data);
          user.camera = !cammute;
          user.question = false;
          user.timestamp = new Date().getTime();
          user.session = janus.sessionId;
          user.handle = videoroom.janusHandleId;

          const { id, timestamp, role, username } = user;
          const d = {
            id,
            timestamp,
            role,
            display: `${username} 📱`,
            is_group: false,
            is_desktop: false,
          };
          log.info(`[client] Videoroom init: d - ${d} room - ${room.room}`);
          videoroom
            .join(room.room, d)
            .then(async (data) => {
              log.info("[client] Joined respond:", data);
              useUserStore.getState().setRfid(data.id);

              // Feeds count with user role
              let feeds_count = data.publishers.filter(
                (feed) => feed.display.role === userRolesEnum.user
              ).length;
              if (feeds_count > 25) {
                alert(i18n.t("messages.maxUsersInRoom"));
                get().restartRoom();
                return;
              }

              await makeSubscription(data.publishers);
              useUserStore.getState().sendUserState({}, d);
              attempts = 0;
              const stream = getStream();
              stream.getVideoTracks().forEach((track) => {
                track.enabled = !cammute;
              });
              return videoroom
                .publish(stream)
                .then((json) => {
                  log.debug("[client] videoroom published", json);
                })
                .catch((err) => {
                  log.error("[client] Publish error :", err);
                  get().restartRoom();
                });
            })
            .catch((err) => {
              log.error("[client] Join error:", err);
              get().restartRoom();
            });
        });

        janus.attach(subscriber).then((data) => {
          console.info("[client] Subscriber Handle: ", data);
        });
      })
      .catch((err) => {
        log.error("[client] Janus init error", err);
        get().restartRoom();
      });

    mqtt.join("galaxy/room/" + room.room);
    mqtt.join("galaxy/room/" + room.room + "/chat", true);
  },
  exitRoom: async () => {
    if (exitWIP) return;
    exitWIP = true;

    const { room } = useRoomStore.getState();
    set({ feedById: {} });
    
    await useShidurStore.getState().cleanJanus();
    
    if (janus) {
      console.log("useInRoomStore exitRoom janus", janus);
      await janus.destroy();
      janus = null;
    }
    
    videoroom = null;
    subscriber = null;
    useInitsStore.getState().setReadyForJoin(false);

    try {
      await mqtt.exit("galaxy/room/" + room.room);
      await mqtt.exit("galaxy/room/" + room.room + "/chat");
    } catch (error) {
      console.error("Error exiting mqtt rooms", error);
    }
    AudioBridge.abandonAudioFocus();
    WakeLockBridge.releaseScreenOn();
    useAudioDevicesStore.getState().abortAudioDevices();
    exitWIP = false;
  },
  restartRoom: async () => {
    console.log("bug fixes: useInRoomStore restartRoom restartWIP", restartWIP);

    if (restartWIP || exitWIP) return;

    restartWIP = true;
    await get().exitRoom();
    _isPlay = useShidurStore.getState().isPlay;
    await sleep(7000);
    _isPlay = useShidurStore.getState().setAutoPlay(_isPlay);
    useInitsStore.getState().setReadyForJoin(true);
    restartWIP = false;
  },
  enterBackground: async () => {
    useSettingsStore.getState().enterAudioMode();
  },
  enterForeground: async () => {
    if (!useSettingsStore.getState().audioMode) {
      useSettingsStore.getState().exitAudioMode();
    }
  },
  updateDisplayById: (data) => {
    const { camera, question, rfid } = data || {};

    set(
      produce((state) => {
        if (state.feedById?.[rfid]) {
          state.feedById[rfid].camera = camera;
          state.feedById[rfid].question = question;
        }
      })
    );
  },
}));

export const activateFeedsVideos = (feeds) => {
  const params = [];
  for (const f of feeds) {
    f.vMid && params.push({ feed: parseInt(f.id), mid: f.vMid });
  }

  if (params.length === 0) return Promise.resolve();

  return subscriber.sub(params);
};

export const deactivateFeedsVideos = (feeds) => {
  const params = [];
  for (const f of feeds) {
    f.vMid && params.push({ feed: parseInt(f.id), mid: f.vMid });
  }

  if (params.length === 0) return Promise.resolve();

  return subscriber.unsub(params);
};
