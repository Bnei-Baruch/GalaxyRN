// External libraries
import produce from 'immer';
import { create } from 'zustand';

// Libs
import { JanusMqtt } from '../libs/janus-mqtt';
import { PublisherPlugin } from '../libs/publisher-plugin';
import { SubscriberPlugin } from '../libs/subscriber-plugin';
import AudioBridge from '../services/AudioBridge';
import logger from '../services/logger';
import { userRolesEnum } from '../shared/enums';
import { configByName } from '../shared/janus-config';
import { deepClone, rejectTimeoutPromise } from '../shared/tools';
import useRoomStore from './fetchRooms';
import useInRoomStore from './inRoom';
import { getStream, useMyStreamStore } from './myStream';
import { useUiActions } from './uiActions';
import { useUserStore } from './user';

const NAMESPACE = 'FeedsStore';

let subscriber = null;
let videoroom = null;
let janus = null;

let restartWIP = false;
let exitWIP = false;

let _subscriberJoined = false;

export const useFeedsStore = create((set, get) => ({
  // State
  feedById: {},
  feedIds: [],
  restartCount: 0,

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

  initFeeds: async () => {
    logger.debug(NAMESPACE, 'initFeeds');

    const { user } = useUserStore.getState();
    const { room } = useRoomStore.getState();

    if (!room?.janus) {
      throw new Error(`room is ${room} in initFeeds`);
    }

    const config = configByName(room.janus);
    logger.debug(NAMESPACE, 'joinRoom config', config);
    janus = new JanusMqtt(user, config.name);
    logger.debug(NAMESPACE, 'joinRoom janus', janus);

    try {
      await janus.init(config.token);
      logger.info(NAMESPACE, 'joinRoom on janus.init');

      // Initialize subscriber and publisher sequentially to avoid race conditions
      await Promise.all([get().initSubscriber(), get().initPublisher()]);
    } catch (err) {
      logger.error(NAMESPACE, 'Janus init error', err);
      await useInRoomStore.getState().restartRoom();
      return;
    }
  },

  initPublisher: async () => {
    logger.debug(NAMESPACE, 'initPublisher');
    const { room } = useRoomStore.getState();
    const { user } = useUserStore.getState();
    const { cammute } = useMyStreamStore.getState();

    if (!room?.janus) {
      throw new Error(`room is ${room} in initPublisher`);
    }

    const config = configByName(room.janus);

    videoroom = new PublisherPlugin(config.iceServers);
    videoroom.subTo = async pubs => {
      logger.debug(NAMESPACE, 'videoroom.subTo start');
      try {
        await get().makeSubscription(pubs);
      } catch (error) {
        logger.error(NAMESPACE, 'Error subscribing to publishers', error);
      }
      logger.debug(NAMESPACE, 'videoroom.subTo sendUserState');
      useUserStore.getState().sendUserState();
      useUiActions.getState().updateWidth();
    };

    videoroom.unsubFrom = async ids => {
      const params = [];
      ids
        .filter(id => id !== get().janusInfo?.rfid)
        .forEach(id => {
          const feed = get().feedById[id];
          if (!feed) return;

          params.push({ feed: parseInt(feed.id) });
          logger.info(
            NAMESPACE,
            `Feed ${feed.id} ${JSON.stringify(
              feed
            )} has left the room, detaching`
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

    videoroom.talkEvent = (id, talking) => {
      set(
        produce(state => {
          if (state.feedById[id]) {
            state.feedById[id].talking = talking;
          }
        })
      );
    };

    try {
      // Check if janus is still available before attempting to attach
      if (!janus) {
        logger.error(NAMESPACE, 'Janus is null, cannot attach publisher');
        throw new Error('Janus is null, cannot attach publisher');
      }

      await janus.attach(videoroom);
    } catch (err) {
      logger.error(NAMESPACE, 'Join error:', err);
      throw new Error('Join error: ' + err);
    }

    AudioBridge.activateAudioOutput();
    logger.info(NAMESPACE, 'Publisher Handle');
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
    logger.info(NAMESPACE, `Videoroom init: d - ${d} room - ${room.room}`);

    const data = await videoroom.join(room.room, d);
    logger.info(NAMESPACE, 'Joined respond');

    useUserStore.getState().setJanusInfo({
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
      throw new Error('Max users in room');
    }

    await get().makeSubscription(data.publishers.filter(p => p.id !== data.id));
    useUserStore.getState().sendUserState();
    const stream = await getStream();
    if (!stream) {
      logger.error(NAMESPACE, 'Stream is null');
      throw new Error('Stream is null');
    }
    stream.getVideoTracks().forEach(track => {
      track.enabled = !cammute;
    });

    const streams = await videoroom.publish(stream);
    useUserStore.getState().setExtraInfo({
      streams: streams,
      isGroup: false,
    });
    logger.debug(NAMESPACE, 'videoroom published', streams);
    attempts = 0;
  },

  initSubscriber: async () => {
    logger.debug(NAMESPACE, 'initSubscriber');
    const { room } = useRoomStore.getState();

    if (!room?.janus) {
      throw new Error(`room is ${room} in initSubscriber`);
    }

    const config = configByName(room.janus);

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

    try {
      // Check if janus is still available before attempting to attach
      if (!janus) {
        logger.error(NAMESPACE, 'Janus is null, cannot attach subscriber');
        throw new Error('Janus is null, cannot attach subscriber');
      }

      await janus.attach(subscriber);
    } catch (error) {
      logger.error(NAMESPACE, 'Error attaching subscriber', error);
      throw new Error('Error attaching subscriber');
    }
  },

  makeSubscription: async pubs => {
    const { room } = useRoomStore.getState();
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
    logger.debug(NAMESPACE, 'makeSubscription unsubs', JSON.stringify(unsubs));

    if (_subscriberJoined) {
      logger.debug(NAMESPACE, 'makeSubscription when _subscriberJoined');
      set({ feedById });
      get().setFeedIds();

      if (subs.length > 0) await subscriber.sub(subs);
      if (unsubs.length > 0) await subscriber.unsub(unsubs);

      return;
    }

    if (subs.length === 0) return;

    await subscriber.join(subs, room.room);
    set({ feedById });
    get().setFeedIds();
    _subscriberJoined = true;
    logger.debug(NAMESPACE, 'makeSubscription end');
    return subs.map(s => s.feed);
  },

  restartFeeds: async () => {
    logger.debug(NAMESPACE, 'restartFeeds', restartWIP);

    if (restartWIP || exitWIP) return;
    restartWIP = true;
    try {
      await get().cleanFeeds();
      await rejectTimeoutPromise(get().initFeeds(), 2000);
    } catch (error) {
      logger.error(NAMESPACE, 'Error restarting feeds', error);
    }

    restartWIP = false;
  },

  cleanFeeds: async () => {
    logger.debug(NAMESPACE, 'cleanFeeds');
    // Clean up Janus
    if (janus) {
      logger.info(NAMESPACE, 'exitRoom janus');
      try {
        await rejectTimeoutPromise(janus.destroy(), 2000);
      } catch (error) {
        logger.error(NAMESPACE, 'Error destroying janus', error);
      }
      janus = null;
    }

    // Reset all module states
    videoroom = null;
    subscriber = null;
    _subscriberJoined = false;
    set({ feedById: {}, feedIds: [] });
  },

  feedAudioModeOn: async () => {
    logger.debug(NAMESPACE, 'allFeedAudioMode');

    const { feedById } = get();
    logger.debug(NAMESPACE, 'enterAudioMode feedById', feedById);
    try {
      const ids = Object.keys(feedById);
      logger.debug(NAMESPACE, 'feedAudioModeOn ids', ids);
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

  reconnectFeeds: async () => {
    const { feedById } = get();
    const ids = Object.keys(feedById);
    logger.debug(NAMESPACE, 'reconnectFeeds ids', ids);
    await get().deactivateFeedsVideos(ids);
    logger.debug(NAMESPACE, 'reconnectFeeds videos deactivated');
    await get().activateFeedsVideos(ids);
    logger.debug(NAMESPACE, 'reconnectFeeds videos activated');
  },
}));
