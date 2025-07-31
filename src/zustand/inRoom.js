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
import { useChatStore } from './chat';
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

export const useInRoomStore = create((set, get) => ({
  // State
  feedById: {},
  feedIds: [],
  isInBackground: false,
  restartCount: 0,

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
      useMyStreamStore.getState().toggleMute(true);
      set({ isInBackground: false });
    } catch (error) {
      logger.error(
        NAMESPACE,
        'Error requesting audio focus or keeping screen on',
        error
      );
      return get().exitRoom();
    }

    if (attempts > 2) {
      get().exitRoom();
      alert('Could not connect to the server, please try again later');
      attempts = 0;
      return;
    }

    attempts++;
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

        let _isSubscribed = false;
        pub.streams
          .filter(s => s.type === 'audio' && s.codec === 'opus')
          .forEach(s => {
            const _data = { feed: id, mid: s.mid };
            if (!feedById[id]) {
              subs.push(_data);
              _isSubscribed = true;
            }
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
        if (!_isSubscribed && vStream) {
          subs.push({ feed: id });
        }

        feedById[id].vMid = vStream?.mid;
        logger.debug(NAMESPACE, 'makeSubscription feedById[id]', feedById[id]);
      }

      logger.debug(NAMESPACE, 'makeSubscription subs', JSON.stringify(subs));
      logger.debug(
        NAMESPACE,
        'makeSubscription unsubs',
        JSON.stringify(unsubs)
      );

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
      try {
        if (_subscriberJoined && params.length > 0) {
          await subscriber.unsub(params);
        }
      } catch (error) {
        logger.error(NAMESPACE, 'Error unsubscribing from publishers', error);
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
      logger.error(NAMESPACE, 'videoroom iceFailed');
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
      if (on && track.kind === 'video') {
        let url;
        try {
          url = stream.toURL();
        } catch (error) {
          logger.error(NAMESPACE, 'Error setting feed url', error);
          url = null;
        }
        set(
          produce(state => {
            state.feedById[id].vOn = true;
            state.feedById[id].vWIP = false;
            state.feedById[id].url = url;
          })
        );
      }
    };

    subscriber.onUpdate = streams => {
      logger.debug(NAMESPACE, 'subscriber.onUpdate streams', streams);
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
            logger.debug(NAMESPACE, 'subscriber.onUpdate feedById[k]', f);
            if (f && !_videosByFeed[f.id]) {
              f.url = null;
              f.vOn = false;
              f.vWIP = false;
            }
          }
        })
      );
    };

    subscriber.iceFailed = async () => {
      logger.warn(NAMESPACE, 'subscriber iceFailed');
      get().restartRoom();
    };

    janus
      .init(config.token)
      .then(data => {
        logger.info(NAMESPACE, 'joinRoom on janus.init', data, janus);
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
                  attempts = 0;
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
    logger.debug(NAMESPACE, 'exitRoom exitWIP', exitWIP);
    if (exitWIP) {
      logger.debug(NAMESPACE, 'exitRoom exitWIP is true');
      return;
    }

    exitWIP = true;
    const { room } = useRoomStore.getState();
    set({ feedById: {}, feedIds: [] });
    logger.debug(NAMESPACE, 'exitRoom room', room);
    try {
      // Clean up shidur first
      await useShidurStore.getState().cleanJanus();
    } catch (error) {
      logger.error(NAMESPACE, 'Error cleaning shidur janus', error);
    }

    logger.debug(NAMESPACE, 'exitRoom janus', janus);
    // Clean up Janus
    if (janus) {
      logger.info(NAMESPACE, 'useInRoomStore exitRoom janus', janus);
      try {
        await janus.destroy();
      } catch (error) {
        logger.error(NAMESPACE, 'Error destroying janus', error);
      }
      janus = null;
    }

    // Reset all module states
    videoroom = null;
    subscriber = null;
    _subscriberJoined = false;

    useInitsStore.getState().setReadyForJoin(false);

    logger.debug(NAMESPACE, 'exitRoom setReadyForJoin(false)');
    try {
      // Clean up MQTT subscriptions
      useChatStore.getState().cleanCounters();
      useChatStore.getState().cleanMessages();
      await mqtt.exit(`galaxy/room/${room.room}`);
      await mqtt.exit(`galaxy/room/${room.room}/chat`);
      await useInitsStore.getState().abortMqtt();
    } catch (error) {
      logger.error(NAMESPACE, 'Error exiting mqtt rooms', error);
    }

    logger.debug(NAMESPACE, 'exitRoom AudioBridge.abandonAudioFocus()');
    // Clean up device states
    try {
      AudioBridge.abandonAudioFocus();
      WakeLockBridge.releaseScreenOn();
    } catch (error) {
      logger.error(NAMESPACE, 'Error cleaning up device states', error);
    }

    exitWIP = false;
    attempts = 0;
  },

  restartRoom: async () => {
    logger.debug(
      NAMESPACE,
      'useInRoomStore restartRoom restartWIP',
      restartWIP
    );

    if (restartWIP || exitWIP) return;

    restartWIP = true;
    const _isPlay = useShidurStore.getState().isPlay;
    await get().exitRoom();
    await sleep(7000);
    logger.debug(NAMESPACE, 'restartRoom setAutoPlay', _isPlay);
    useShidurStore.getState().setAutoPlay(_isPlay);
    useInitsStore.getState().setReadyForJoin(true);
    restartWIP = false;
  },

  // App lifecycle
  enterBackground: async () => {
    set({ isInBackground: true });
    useSettingsStore.getState().enterAudioMode();
  },

  enterForeground: async () => {
    set({ isInBackground: false });
    if (!useSettingsStore.getState().audioMode) {
      useSettingsStore.getState().exitAudioMode();
    }
  },

  feedAudioModeOn: async () => {
    logger.debug(NAMESPACE, 'allFeedAudioMode');

    const { feedById } = get();
    logger.debug(NAMESPACE, 'enterAudioMode feedById', feedById);
    try {
      const ids = Object.keys(feedById);
      await get().deactivateFeedsVideos(ids);
    } catch (error) {
      logger.error(NAMESPACE, 'allFeedAudioMode error', error);
    }
  },
  activateFeedsVideos: ids => {
    logger.debug(NAMESPACE, 'activateFeedsVideos ids', ids);
    const { feedById } = get();
    const params = [];
    for (const id of ids) {
      const f = feedById[id];
      logger.debug(NAMESPACE, 'activateFeedsVideos feed', f);
      if (f?.vMid && !f.url && !f.vWIP) {
        params.push({ feed: parseInt(id), mid: f.vMid });
      }
    }

    if (params.length === 0) return Promise.resolve();

    return subscriber.sub(params);
  },
  deactivateFeedsVideos: ids => {
    const { feedById } = get();
    const params = [];
    for (const id of ids) {
      const f = feedById[id];
      logger.debug(NAMESPACE, 'deactivateFeedsVideos feed', f);
      if (f?.vMid && f.url) {
        params.push({ feed: parseInt(id), mid: f.vMid });
      }
    }

    if (params.length === 0) return Promise.resolve();

    return subscriber.unsub(params);
  },
}));
