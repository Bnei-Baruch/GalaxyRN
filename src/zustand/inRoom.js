import { create } from 'zustand';
import { JanusMqtt } from '../libs/janus-mqtt';
import GxyConfig from '../shared/janus-config';
import { PublisherPlugin } from '../libs/publisher-plugin';
import { SubscriberPlugin } from '../libs/subscriber-plugin';
import log from 'loglevel';
import { userRolesEnum } from '../shared/enums';
import produce from 'immer';
import { useUserStore } from './user';
import useRoomStore from './fetchRooms';
import { useSettingsStore } from './settings';
import mqtt from '../shared/mqtt';
import { useMyStreamStore, getStream } from './myStream';
import InCallManager from 'react-native-incall-manager';
import i18n from '../i18n/i18n';
import { useInitsStore } from './inits';

let subscriber = null;
let videoroom  = null;
let janus      = null;

let showBarTimeout         = null;
const HIDE_BARS_TIMEOUT_MS = 5000;
let attempts               = 0;

const isVideoStream = s => (s?.type === 'video' && s.codec === 'h264'/* && (s.h264_profile !== '42e01f')*/);

export const useInRoomStore = create((set, get) => ({
  memberByFeed   : {},
  showBars       : true,
  toggleShowBars : (hideOnTimeout, showBars = !get().showBars) => {
    clearTimeout(showBarTimeout);
    if (hideOnTimeout && showBars) {
      showBarTimeout = setTimeout(() => set({ showBars: false }), HIDE_BARS_TIMEOUT_MS);
    }
    set({ showBars });
  },
  joinRoom       : () => {
    if (janus) {
      janus.destroy();
      janus = null;
    }
    const { user }                   = useUserStore.getState();
    const { room }                   = useRoomStore.getState();
    const { cammmute, setTimestmap } = useMyStreamStore.getState();

    setTimestmap();
    InCallManager.start({ media: 'video' });
    InCallManager.setKeepScreenOn(true);
    let _subscriberJoined = false;

    const makeSubscription = (pubs) => {
      const subs = getSubscriptionFromPublishers(pubs);
      if (subs.length === 0)
        return Promise.resolve();

      if (_subscriberJoined) {
        set(produce(state => {
          pubs
            .filter(p => subs.some(s => s.feed === p.id))
            .forEach(({ display, id, streams }) => {
              const vStream          = streams.find(isVideoStream);
              state.memberByFeed[id] = { id, display: JSON.parse(display), vMid: vStream?.mid };
            });
        }));
        subscriber.sub(subs);
        return Promise.resolve();
      }

      return subscriber.join(subs, room.room).then((data) => {
        _subscriberJoined = true;

        set(produce(state => {
          for (const stream of data.streams) {
            pubs
              .filter(p => stream.feed_id === p.id)
              .forEach(({ display, id, streams }) => {
                const vStream          = streams.find(isVideoStream);
                state.memberByFeed[id] = { id, display: JSON.parse(display), vMid: vStream?.mid };
              });
          }
        }));
        return subs.map(s => s.feed);
      });
    };

    const getSubscriptionFromPublishers = (pubs) => {
      const { audioMode } = useSettingsStore.getState();

      const result = [];
      for (const pub of pubs) {
        if (get().memberByFeed[pub.id]?.url || !pub.streams)
          continue;

        pub.streams
          .filter(s => (!audioMode && isVideoStream(s)) || (s.type === 'audio' && s.codec === 'opus'))
          .forEach(s => {
            result.push({ feed: pub.id, mid: s.mid });
          });
      }
      return result;
    };

    const config = GxyConfig.instanceConfig(room.janus);

    janus          = new JanusMqtt(user, config.name);
    janus.onStatus = (srv, status) => {
      if (status === 'offline') {
        alert('Janus Server - ' + srv + ' - Offline');
        get().restartRoom();
        return;
      }

      if (status === 'error') {
        console.error('[client] Janus error, reconnecting...');
        get().restartRoom();
      }
    };

    /**
     * publish my video stream to the room
     */
    videoroom = new PublisherPlugin(config.iceServers);
    videoroom.subTo = (pubs) => makeSubscription(pubs)
      .then(() => useUserStore.getState().sendUserState());

    videoroom.unsubFrom = async (ids) => {
      const params = [];
      ids.forEach(id => {
        const feed = get().memberByFeed[id];
        if (!feed) return;

        params.push({ feed: parseInt(feed.id) });
        log.info('[client] Feed ' + JSON.stringify(feed) + ' (' + feed.id + ') has left the room, detaching');
      });

      // Send an unsubscribe request.
      if (_subscriberJoined && params.length > 0) {
        await subscriber.unsub(params);
      }

      set(produce(state => {
        ids.forEach(id => {
          state.memberByFeed[id] && delete state.memberByFeed[id];
        });
      }));
    };
    videoroom.talkEvent = (id, talking) => {
      set(produce(state => {
        if (state.memberByFeed[id])
          state.memberByFeed[id].talking = talking;
      }));
    };

    /**
     * subscribe to members of the room
     */
    subscriber = new SubscriberPlugin(config.iceServers);
    subscriber.onTrack = (track, stream, on) => {
      const { id } = stream;
      log.info('[client] >> This track is coming from feed ' + id + ':', track.id, track, stream);
      if (on) {

        if (track.kind === 'video') {
          set(produce(state => {
            state.memberByFeed[id].url = stream.toURL();
          }));
        }
      }
    };

    subscriber.onUpdate = (streams) => {
      if (!streams) return;

      const _videosByFeed = {};
      for (const s of streams) {
        if (s.type !== 'video' || !s.active)
          continue;
        _videosByFeed[s.feed_id] = s;
      }
      log.debug('[client] Updated _videosByFeed', _videosByFeed);
      set(produce(state => {
        for (const k in state.memberByFeed) {
          const f = state.memberByFeed[k];
          if (!_videosByFeed[f.id]) {
            f.url = undefined;
          }
        }
      }));
    };

    janus.init(config.token).then((data) => {
      log.info('[client] Janus init', data);
      janus.attach(videoroom).then((data) => {
        console.info('[client] Publisher Handle: ', data);
        user.camera    = cammmute;
        user.question  = false;
        user.timestamp = Date.now();
        user.session   = janus.sessionId;
        user.handle    = videoroom.janusHandleId;

        const { id, timestamp, role, username } = user;
        const d                                 = {
          id, timestamp, role,
          display   : username,
          is_group  : false,
          is_desktop: false,
        };
        log.info(`[client] Videoroom init: d - ${d} room - ${room.room}`);
        videoroom.join(room.room, d).then(async (data) => {
          log.info('[client] Joined respond:', data);
          useUserStore.getState().setRfid(data.id);

          // Feeds count with user role
          let feeds_count = data.publishers.filter((feed) => feed.display.role === userRolesEnum.user).length;
          if (feeds_count > 25) {
            alert(i18n.t('messages.maxUsersInRoom'));
            get().restartRoom();
            return;
          }

          await makeSubscription(data.publishers);
          useUserStore.getState().sendUserState();
          useMyStreamStore.getState().toggleMute(true);

          return videoroom.publish(getStream()).then((json) => {
            log.debug('[client] videoroom published', json);

            mqtt.join('galaxy/room/' + room.room);
            mqtt.join('galaxy/room/' + room.room + '/chat', true);
            //if (isGroup) videoroom.setBitrate(600000)
          }).catch((err) => {
            log.error('[client] Publish error :', err);
            get().restartRoom();
          });
        }).catch((err) => {
          log.error('[client] Join error:', err);
          get().restartRoom();
        });
      });

      janus.attach(subscriber).then((data) => {
        console.info('[client] Subscriber Handle: ', data);
      });
    }).catch((err) => {
      log.error('[client] Janus init error', err);
      get().restartRoom();
    });

    mqtt.join('galaxy/room/' + room.room);
    mqtt.join('galaxy/room/' + room.room + '/chat', true);
  },
  exitRoom       : async () => {
    const { room } = useRoomStore.getState();
    set({ memberByFeed: {} });
    await janus?.destroy();
    janus      = null;
    videoroom  = null;
    subscriber = null;
    useSettingsStore.getState().setReadyForJoin(false);

    await mqtt.exit('galaxy/room/' + room.room);
    await mqtt.exit('galaxy/room/' + room.room + '/chat');
    await useInitsStore.getState().endMqtt();

    InCallManager.setKeepScreenOn(false);
    InCallManager.stop();
  },
  restartRoom    : async () => {
    await get().exitRoom();
    if (attempts < 5) {
      get().joinRoom();
    }
  },
  toggleMute     : (stream) => {
    videoroom.mute(null, stream);
  },
  enterBackground: async () => {
    useSettingsStore.getState().enterAudioMode();
  },
  enterForeground: async () => {
    useSettingsStore.getState().exitAudioMode();
  },
}));

export const activateFeedsVideos = (feeds) => {
  const params = [];
  for (const f of feeds) {
    f.vMid && params.push({ feed: parseInt(f.id), mid: f.vMid });
  }

  if (params.length === 0)
    return Promise.resolve();

  return subscriber.sub(params);
};

export const deactivateFeedsVideos = (feeds) => {
  const params = [];
  for (const f of feeds) {
    f.vMid && params.push({ feed: parseInt(f.id), mid: f.vMid });
  }

  if (params.length === 0)
    return Promise.resolve();

  return subscriber.unsub(params);
};