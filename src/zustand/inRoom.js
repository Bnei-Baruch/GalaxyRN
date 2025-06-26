// External libraries
import produce from 'immer';
import { create } from 'zustand';

// i18n
import i18n from '../i18n/i18n';

// Libs
import { JanusMqtt } from '../libs/janus-mqtt';
import { PublisherPlugin } from '../libs/publisher-plugin';
import { SubscriberPlugin } from '../libs/subscriber-plugin';

// Services
import AudioBridge from '../services/AudioBridge';
import logger from '../services/logger';
import WakeLockBridge from '../services/WakeLockBridge';

// Shared modules
import { userRolesEnum } from '../shared/enums';
import GxyConfig from '../shared/janus-config';
import mqtt from '../shared/mqtt';
import { deepClone, sleep } from '../shared/tools';

// Zustand stores
import useAudioDevicesStore from './audioDevices';
import useRoomStore from './fetchRooms';
import { useInitsStore } from './inits';
import { getStream, useMyStreamStore } from './myStream';
import { useSettingsStore } from './settings';
import { useShidurStore } from './shidur';
import { useUiActions } from './uiActions';
import { useUserStore } from './user';

const NAMESPACE = 'InRoom';

let subscriber = null;
let videoroom = null;
let janus = null;

let attempts = 0;
let restartWIP = false;
let exitWIP = false;

// URL buffer queue
let urlBuffer = [];
let isProcessingBuffer = false;

export const useInRoomStore = create((set, get) => ({
  // State
  feedById: {},
  feedIds: [],

  // Feed management
  setFeedIds: () => {
    const { feedById } = get();
    const { timestamp } = useMyStreamStore.getState();
    logger.debug(NAMESPACE, 'Feeds feedIds', timestamp);

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

    let notAddMy = false;
    if (_ms.length === 0) {
      return notAddMy ? [] : ['my'];
    }

    const feedIds = _ms.reduce((acc, x, i) => {
      if (!x) return acc;

      if (!notAddMy && x.display?.timestamp > timestamp) {
        acc.push('my');
        notAddMy = true;
      }

      acc.push(x.id);
      return acc;
    }, []);

    if (!notAddMy) {
      feedIds.push('my');
    }

    set({ feedIds });
  },

  setFeedUrlWithDelay: async (id, stream) => {
    if (get().feedById[id]?.stream) return;

    urlBuffer.push({ id, stream });
    if (isProcessingBuffer) return;

    isProcessingBuffer = true;
    while (urlBuffer.length > 0) {
      const { id, stream } = urlBuffer.shift();
      set(
        produce(state => {
          state.feedById[id].stream = stream;
        })
      );
      await sleep(100);
    }
    isProcessingBuffer = false;
  },

  updateDisplayById: data => {
    const { camera, question, rfid } = data || {};

    set(
      produce(state => {
        if (state.feedById?.[rfid]) {
          state.feedById[rfid].camera = camera;
          state.feedById[rfid].question = question;
        }
        state.isRoomQuestion = !!question;
      })
    );
  },

  // Room lifecycle
  joinRoom: async () => {
    try {
      AudioBridge.requestAudioFocus();
      await WakeLockBridge.keepScreenOn();
      useAudioDevicesStore.getState().initAudioDevices();
      useMyStreamStore.getState().toggleMute(true);
    } catch (error) {
      logger.error(
        NAMESPACE,
        'Error requesting audio focus or keeping screen on',
        error
      );
      return get().exitRoom();
    }

    attempts++;
    if (attempts > 5) {
      get().exitRoom();
      alert('Could not connect to the server, please try again later');
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

    const makeSubscription = async pubs => {
      logger.debug(NAMESPACE, 'makeSubscription pubs', pubs);

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

        pub.streams
          .filter(s => s.type === 'audio' && s.codec === 'opus')
          .forEach(s => {
            const _data = { feed: id, mid: s.mid };
            if (!feedById[id]) subs.push(_data);
          });

        // Sub video streams
        const vStream = pub.streams.find(
          s => s?.type === 'video' && s.codec === 'h264'
        );

        if (!feedById[id]) {
          logger.debug(NAMESPACE, `makeSubscription new feed ${id}`);
          const camera = !!vStream && !vStream.disabled;
          feedById[id] = {
            id,
            display: JSON.parse(display),
            camera,
          };
        }

        feedById[id].vMid = vStream?.mid;
        logger.debug(NAMESPACE, 'makeSubscription feedById[id]', feedById[id]);
      }

      logger.debug(NAMESPACE, 'makeSubscription subs', subs);
      logger.debug(NAMESPACE, 'makeSubscription unsubs', unsubs);

      if (_subscriberJoined) {
        logger.debug(NAMESPACE, 'makeSubscription when _subscriberJoined');
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
      logger.debug(NAMESPACE, 'makeSubscription end');
      return subs.map(s => s.feed);
    };

    const config = GxyConfig.instanceConfig(room.janus);
    logger.debug(NAMESPACE, 'useInRoomStore joinRoom config', config);
    janus = new JanusMqtt(user, config.name);

    janus.onStatus = (srv, status) => {
      if (status === 'offline') {
        alert('Janus Server - ' + srv + ' - Offline');
        get().exitRoom();
        return;
      }

      if (status === 'error') {
        logger.error(NAMESPACE, 'Janus error, reconnecting...');
        get().restartRoom();
      }
    };

    /**
     * Publish my video stream to the room
     */
    videoroom = new PublisherPlugin(config.iceServers);
    videoroom.subTo = async pubs => {
      logger.debug(NAMESPACE, 'videoroom.subTo start');
      try {
        await makeSubscription(pubs);
      } catch (error) {
        logger.error(NAMESPACE, 'Error subscribing to publishers', error);
      }
      logger.debug(NAMESPACE, 'videoroom.subTo sendUserState');
      useUserStore.getState().sendUserState();
      useUiActions.getState().updateWidth();
    };

    videoroom.unsubFrom = async ids => {
      const params = [];
      ids.forEach(id => {
        const feed = get().feedById[id];
        if (!feed) return;

        params.push({ feed: parseInt(feed.id) });
        logger.info(
          NAMESPACE,
          `Feed ${feed.id} ${JSON.stringify(feed)} has left the room, detaching`
        );
      });

      // Send an unsubscribe request
      if (_subscriberJoined && params.length > 0) {
        await subscriber.unsub(params);
      }

      set(
        produce(state => {
          ids.forEach(id => {
            state.feedById[id] && delete state.feedById[id];
          });
        })
      );

      useUiActions.getState().updateWidth();
    };

    videoroom.iceFailed = async () => {
      get().restartRoom();
    };

    videoroom.talkEvent = (id, talking) => {
      set(
        produce(state => {
          if (state.feedById[id]) {
            state.feedById[id].talking = talking;
          }
        })
      );
    };

    /**
     * Subscribe to members of the room
     */
    subscriber = new SubscriberPlugin(config.iceServers);
    subscriber.onTrack = (track, stream, on) => {
      const { id } = stream;
      logger.info(
        NAMESPACE,
        `>> This track is coming from feed ${id}: ${JSON.stringify(track)}`
      );
      if (on) {
        if (track.kind === 'video') {
          get().setFeedUrlWithDelay(id, stream);
        }
      }
    };

    subscriber.onUpdate = streams => {
      if (!streams) return;

      const _videosByFeed = {};
      for (const s of streams) {
        if (s.type !== 'video' || !s.active) continue;
        _videosByFeed[s.feed_id] = s;
      }
      logger.debug(NAMESPACE, 'Updated _videosByFeed', _videosByFeed);
      set(
        produce(state => {
          for (const k in state.feedById) {
            const f = state.feedById[k];
            if (!_videosByFeed[f.id]) {
              f.stream = null;
            }
          }
        })
      );
    };

    subscriber.iceFailed = async () => {
      logger.warn(NAMESPACE, '[subscriber] iceFailed');
      get().restartRoom();
    };

    janus
      .init(config.token)
      .then(data => {
        logger.info(NAMESPACE, 'joinRoom on janus.init', data);
        janus.attach(videoroom).then(data => {
          AudioBridge.activateAudioOutput();
          logger.info(NAMESPACE, 'Publisher Handle: ', data);
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
          logger.info(
            NAMESPACE,
            `Videoroom init: d - ${d} room - ${room.room}`
          );

          videoroom
            .join(room.room, d)
            .then(async data => {
              logger.info(NAMESPACE, 'Joined respond:', data);

              useUserStore.getState().setJannusInfo({
                session: janus.sessionId,
                handle: videoroom.janusHandleId,
                rfid: data.id,
                timestamp,
              });

              // Feeds count with user role
              let feeds_count = data.publishers.filter(
                feed => feed.display.role === userRolesEnum.user
              ).length;
              if (feeds_count > 25) {
                alert(i18n.t('messages.maxUsersInRoom'));
                get().restartRoom();
                return;
              }

              await makeSubscription(
                data.publishers.filter(p => p.id !== data.id)
              );
              useUserStore.getState().sendUserState();
              attempts = 0;
              const stream = await getStream();
              if (!stream) {
                logger.error(NAMESPACE, 'Stream is null');
                get().restartRoom();
                return;
              }
              stream.getVideoTracks().forEach(track => {
                track.enabled = !cammute;
              });
              return videoroom
                .publish(stream)
                .then(json => {
                  useUserStore.getState().setExtraInfo({
                    streams: json.streams,
                    isGroup: false,
                  });
                  logger.debug(NAMESPACE, 'videoroom published', json);
                })
                .catch(err => {
                  logger.error(NAMESPACE, 'Publish error :', err);
                  get().restartRoom();
                });
            })
            .catch(err => {
              logger.error(NAMESPACE, 'Join error:', err);
              get().restartRoom();
            });
        });

        janus.attach(subscriber).then(data => {
          logger.info(NAMESPACE, 'Subscriber Handle: ', data);
        });
      })
      .catch(err => {
        logger.error(NAMESPACE, 'Janus init error', err);
        get().restartRoom();
      });

    mqtt.join(`galaxy/room/${room.room}`);
    mqtt.join(`galaxy/room/${room.room}/chat`, true);
  },

  exitRoom: async () => {
    if (exitWIP) return;
    exitWIP = true;

    const { room } = useRoomStore.getState();
    set({ feedById: {}, feedIds: [] });

    await useShidurStore.getState().cleanJanus();

    if (janus) {
      logger.info(NAMESPACE, 'useInRoomStore exitRoom janus', janus);
      await janus.destroy();
      janus = null;
    }

    videoroom = null;
    subscriber = null;
    useInitsStore.getState().setReadyForJoin(false);

    try {
      await mqtt.exit(`galaxy/room/${room.room}`);
      await mqtt.exit(`galaxy/room/${room.room}/chat`);
    } catch (error) {
      logger.error(NAMESPACE, 'Error exiting mqtt rooms', error);
    }

    AudioBridge.abandonAudioFocus();
    WakeLockBridge.releaseScreenOn();
    useAudioDevicesStore.getState().abortAudioDevices();
    exitWIP = false;
  },

  restartRoom: async () => {
    logger.debug(
      NAMESPACE,
      'bug fixes: useInRoomStore restartRoom restartWIP',
      restartWIP
    );

    if (restartWIP || exitWIP) return;

    restartWIP = true;
    await get().exitRoom();
    _isPlay = useShidurStore.getState().isPlay;
    await sleep(7000);
    _isPlay = useShidurStore.getState().setAutoPlay(_isPlay);
    useInitsStore.getState().setReadyForJoin(true);
    restartWIP = false;
  },

  // App lifecycle
  enterBackground: async () => {
    useSettingsStore.getState().enterAudioMode();
  },

  enterForeground: async () => {
    if (!useSettingsStore.getState().audioMode) {
      useSettingsStore.getState().exitAudioMode();
    }
  },
  activateFeedsVideos: ids => {
    const { feedById } = get();
    const params = [];
    for (const id of ids) {
      const f = feedById[id];
      logger.debug(NAMESPACE, 'activateFeedsVideos f', f);
      if (f.vMid && !f.stream) {
        params.push({ feed: parseInt(id), mid: f.vMid });
      }
    }

    if (params.length === 0) return Promise.resolve();

    return subscriber.sub(params);
  },
  deactivateFeedsVideos: ids => {
    const params = [];
    for (const id of ids) {
      const f = feedById[id];
      logger.debug(NAMESPACE, 'deactivateFeedsVideos f', f);
      if (f.vMid && f.stream) {
        params.push({ feed: parseInt(id), mid: f.vMid });
      }
    }

    if (params.length === 0) return Promise.resolve();

    return subscriber.unsub(params);
  },
}));
