import { create } from "zustand";
import { JanusMqtt } from "../libs/janus-mqtt";
import GxyConfig from "../shared/janus-config";
import { PublisherPlugin } from "../libs/publisher-plugin";
import { SubscriberPlugin } from "../libs/subscriber-plugin";
import logger from "../services/logger";
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

const NAMESPACE = 'InRoom';

let subscriber = null;
let videoroom = null;
let janus = null;

let attempts = 0;
let restartWIP = false;
let exitWIP = false;

export const useInRoomStore = create((set, get) => ({
  feedById: {},
  feedIds: [],
  setFeedIds: () => {
    const { feedById } = get();
    const { hideSelf } = useSettingsStore.getState();
    const { timestamp } = useMyStreamStore.getState();
    logger.debug(NAMESPACE, "Feeds feedIds", timestamp);

    const _ms = Object.values(feedById);
    _ms.sort((a, b) => {
      if (!!a.display?.is_group && !b.display?.is_group) {
        return -1;
      }
      if (!a.display?.is_group && !!b.display?.is_group) {
        return 1;
      }
      return a.display?.timestamp - b.display?.timestamp;
    });

    let notAddMy = hideSelf;
    if (_ms.length === 0) {
      return notAddMy ? [] : ["my"];
    }

    const feedIds = _ms.reduce((acc, x, i) => {
      if (!x) return acc;

      if (!notAddMy && x.display?.timestamp > timestamp) {
        acc.push("my");
        notAddMy = true;
      }

      acc.push(x.id);
      return acc;
    }, []);

    if (!notAddMy) {
      feedIds.push("my");
    }

    set({ feedIds });
  },
  joinRoom: async () => {
    try {
      await AudioBridge.requestAudioFocus();
      await WakeLockBridge.keepScreenOn();
      useAudioDevicesStore.getState().initAudioDevices();
      useMyStreamStore.getState().toggleMute(true);
    } catch (error) {
      logger.error(NAMESPACE, "Error requesting audio focus or keeping screen on", error);
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
    const { cammute } = useMyStreamStore.getState();

    let _subscriberJoined = false;

    const makeSubscription = async (pubs) => {
      logger.debug(NAMESPACE, "makeSubscription pubs", pubs);
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

        //sub audio streams
        // TODO: if mid was changed
        pub.streams
          .filter((s) => s.type === "audio" && s.codec === "opus")
          .forEach((s) => {
            const _data = { feed: id, mid: s.mid };
            if (!feedById[id]) subs.push(_data);
          });

        //sub video streams
        const vStream = pub.streams.find(
          (s) => s?.type === "video" && s.codec === "h264"
        );

        if (vStream) {
          logger.debug(NAMESPACE, "makeSubscription vStream", vStream);
          const _data = { feed: id, mid: vStream.mid };
          if (!feedById[id] && !vStream.disabled && !audioMode) {
            logger.debug(NAMESPACE, "makeSubscription subs.push(_data)", _data);
            subs.push(_data);
          } else if (feedById[id] && (vStream.disabled || audioMode)) {
            logger.debug(NAMESPACE, "makeSubscription unsubs.push(_data)", _data);
            unsubs.push(_data);
          }
        }

        // dont rewrite feedById[id] was get from mqtt
        if (!feedById[id]) {
          feedById[id] = {
            id,
            display: JSON.parse(display),
            camera: !!vStream && !vStream.disabled,
          };
        }
        feedById[id].vMid = vStream?.mid;
        logger.debug(NAMESPACE, "makeSubscription feedById[id]", feedById[id]);
      }

      if (_subscriberJoined) {
        logger.debug(NAMESPACE, "makeSubscription when _subscriberJoined");
        set({ feedById });
        get().setFeedIds();

        if (subs.length > 0) await subscriber.sub(subs);

        if (unsubs.length > 0) await subscriber.unsub(subs);

        return;
      }

      if (subs.length === 0) return;

      await subscriber.join(subs, room.room);
      set({ feedById });
      get().setFeedIds();
      _subscriberJoined = true;
      logger.debug(NAMESPACE, "makeSubscription end");
      return subs.map((s) => s.feed);
    };

    const config = GxyConfig.instanceConfig(room.janus);
    logger.debug(NAMESPACE, "useInRoomStore joinRoom config", config);
    janus = new JanusMqtt(user, config.name);
    janus.onStatus = (srv, status) => {
      if (status === "offline") {
        alert("Janus Server - " + srv + " - Offline");
        get().exitRoom();
        return;
      }

      if (status === "error") {
        logger.error(NAMESPACE, "Janus error, reconnecting...");
        get().restartRoom();
      }
    };

    /**
     * publish my video stream to the room
     */
    videoroom = new PublisherPlugin(config.iceServers);
    videoroom.subTo = async (pubs) => {
      logger.debug(NAMESPACE, "videoroom.subTo start");
      try {
        await makeSubscription(pubs);
      } catch (error) {
        logger.error(NAMESPACE, "Error subscribing to publishers", error);
      }
      logger.debug(NAMESPACE, "videoroom.subTo sendUserState");
      useUserStore.getState().sendUserState();
      useUiActions.getState().updateWidth();
    };

    videoroom.unsubFrom = async (ids) => {
      const params = [];
      ids.forEach((id) => {
        const feed = get().feedById[id];
        if (!feed) return;

        params.push({ feed: parseInt(feed.id) });
        logger.info(NAMESPACE, 
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
          if (state.feedById[id]) {
            state.feedById[id].talking = talking;
          }
        })
      );
    };

    /**
     * subscribe to members of the room
     */
    subscriber = new SubscriberPlugin(config.iceServers);
    subscriber.onTrack = (track, stream, on) => {
      const { id } = stream;
      logger.info(NAMESPACE, 
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
      logger.debug(NAMESPACE, "[client] Updated _videosByFeed", _videosByFeed);
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
      logger.warn(NAMESPACE, "[subscriber] iceFailed");
      get().restartRoom();
    };

    janus
      .init(config.token)
      .then((data) => {
        logger.info(NAMESPACE, "[client] joinRoom on janus.init", data);
        janus.attach(videoroom).then((data) => {
          AudioBridge.activateAudioOutput();
          logger.info(NAMESPACE, "[client] Publisher Handle: ", data);
          const timestamp = new Date().getTime();

          const { id, role, username } = user;
          const d = {
            id,
            timestamp,
            role,
            display: `${username} 📱`,
            is_group: false,
            is_desktop: false,
          };
          logger.info(NAMESPACE, `[client] Videoroom init: d - ${d} room - ${room.room}`);
          videoroom
            .join(room.room, d)
            .then(async (data) => {
              logger.info(NAMESPACE, "[client] Joined respond:", data);

              useUserStore.getState().setJannusInfo({
                session: janus.sessionId,
                handle: videoroom.janusHandleId,
                rfid: data.id,
                timestamp,
              });

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
              useUserStore.getState().sendUserState();
              attempts = 0;
              const stream = getStream();
              stream.getVideoTracks().forEach((track) => {
                track.enabled = !cammute;
              });
              return videoroom
                .publish(stream)
                .then((json) => {
                  useUserStore.getState().setExtraInfo({
                    streams: json.streams,
                    isGroup: false,
                  });
                  logger.debug(NAMESPACE, "[client] videoroom published", json);
                })
                .catch((err) => {
                  logger.error(NAMESPACE, "[client] Publish error :", err);
                  get().restartRoom();
                });
            })
            .catch((err) => {
              logger.error(NAMESPACE, "[client] Join error:", err);
              get().restartRoom();
            });
        });

        janus.attach(subscriber).then((data) => {
          logger.info(NAMESPACE, "[client] Subscriber Handle: ", data);
        });
      })
      .catch((err) => {
        logger.error(NAMESPACE, "[client] Janus init error", err);
        get().restartRoom();
      });

    mqtt.join("galaxy/room/" + room.room);
    mqtt.join("galaxy/room/" + room.room + "/chat", true);
  },
  exitRoom: async () => {
    if (exitWIP) return;
    exitWIP = true;

    const { room } = useRoomStore.getState();
    set({ feedById: {}, feedIds: [] });

    await useShidurStore.getState().cleanJanus();

    if (janus) {
      logger.info(NAMESPACE, "useInRoomStore exitRoom janus", janus);
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
      logger.error(NAMESPACE, "Error exiting mqtt rooms", error);
    }
    AudioBridge.abandonAudioFocus();
    WakeLockBridge.releaseScreenOn();
    useAudioDevicesStore.getState().abortAudioDevices();
    exitWIP = false;
  },
  restartRoom: async () => {
    logger.debug(NAMESPACE, "bug fixes: useInRoomStore restartRoom restartWIP", restartWIP);

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
        state.isRoomQuestion = !!question;
      })
    );
  },
}));

export const activateFeedsVideos = (feeds) => {
  const params = [];
  for (const f of feeds) {
    logger.debug(NAMESPACE, "activateFeedsVideos f", f);
    f.vMid && params.push({ feed: parseInt(f.id), mid: f.vMid });
  }

  if (params.length === 0) return Promise.resolve();

  return subscriber.sub(params);
};

export const deactivateFeedsVideos = (feeds) => {
  const params = [];
  for (const f of feeds) {
    logger.debug(NAMESPACE, "deactivateFeedsVideos f", f);
    f.vMid && params.push({ feed: parseInt(f.id), mid: f.vMid });
  }

  if (params.length === 0) return Promise.resolve();

  return subscriber.unsub(params);
};
