import { create } from 'zustand';
import { JanusMqtt } from '../libs/janus-mqtt';
import GxyJanus from '../shared/janus-utils';
import { PublisherPlugin } from '../libs/publisher-plugin';
import { SubscriberPlugin } from '../libs/subscriber-plugin';
import log from 'loglevel';
import { userRolesEnum } from '../shared/enums';
import produce from 'immer';
import { useUserStore } from './user';
import useRoomStore from './fetchRooms';
import { useSettingsStore } from './settings';
import mqtt from '../shared/mqtt';
import { getStream, useMyStreamStore } from './myStream';
import { sendUserState } from '../shared/tools';
import InCallManager from 'react-native-incall-manager';
//import { NativeModules } from 'react-native';
//const { KeepAwakeModule } = NativeModules;

let subscriber               = null;
let videoroom                = null;
let janus                    = null;
const activeFeeds            = [];
export const MEMBER_PER_PAGE = 6;

let showBarTimeout         = null;
const HIDE_BARS_TIMEOUT_MS = 5000;

export const useInRoomStore = create((set, get) => ({
  memberByFeed: {},
  showBars    : true,
  myTymstemp  : Date.now(),
  setShowBars : (hideOnTimeout) => {
    console.log('show hide bars: setShowBars', hideOnTimeout);
    clearTimeout(showBarTimeout);
    if (hideOnTimeout) {
      showBarTimeout = setTimeout(() => set({ showBars: false }), HIDE_BARS_TIMEOUT_MS);
    }
    set({ showBars: true });
  },
  joinRoom    : () => {
    if (janus) {
      janus.destroy();
      janus = null;
    }
    const { user }                = useUserStore.getState();
    const { room }                = useRoomStore.getState();
    const { question, audioMode } = useSettingsStore.getState();
    const { cammmute }            = useMyStreamStore.getState();
    InCallManager.start({ media: 'video' });
    InCallManager.setKeepScreenOn(audioMode);
    //KeepAwakeModule.activate(audioMode);
    let _subscriberJoined = false;

    const makeSubscription = (pubs) => {
      log.info('Subscriber pubs: ', pubs);
      const subs = getSubscriptionFromPublishers(pubs);
      log.info('Subscriber subs: ', subs);
      if (subs.length === 0)
        return Promise.resolve();

      if (_subscriberJoined) {
        set(produce(state => {
          pubs
            .filter(p => subs.find(s => s.feed === p.id))
            .forEach(({ display, id }) => {
              state.memberByFeed[id] = {
                ...state.memberByFeed[id],
                id,
                display: JSON.parse(display),
              };
            });
        }));
        subscriber.sub(subs);
        return Promise.resolve();
      }

      log.info('Subscriber before join: ', subs, room.room);
      return subscriber.join(subs, room.room).then((data) => {
        _subscriberJoined = true;
        log.info('[client] Subscriber join: ', data);
        set(produce(state => {
          data.streams.forEach(({ mid, feed_display, feed_id }) => {
            state.memberByFeed[feed_id] = {
              ...state.memberByFeed[feed_id],
              mid,
              id     : feed_id,
              display: JSON.parse(feed_display),
            };
          });
        }));
        return subs.map(s => s.feed);
      });
    };

    const getSubscriptionFromPublishers = (pubs) => {
      const result = [];
      for (const pub of pubs) {
        const prevFeed = get().memberByFeed[pub.id];
        console.info('getSubscriptionFromPublishers prevFeed', prevFeed);
        const prevVideo = prevFeed?.streams?.find(
          (v) => v.type === 'video' && v.codec === 'h264');
        const prevAudio = prevFeed?.streams?.find(
          (a) => a.type === 'audio' && a.codec === 'opus');

        pub.streams?.forEach((s) => {
          console.info('getSubscriptionFromPublishers pub streams', s);
          let hasVideo = /*!muteOtherCams && */s.type === 'video' &&
            s.codec === 'h264' && !prevVideo;
          if (s?.h264_profile && s?.h264_profile !== '42e01f') {
            hasVideo = false;
          }

          const hasAudio = s.type === 'audio' && s.codec === 'opus' &&
            !prevAudio;

          if (hasVideo || hasAudio || s.type === 'data') {
            result.push({ feed: pub.id, mid: s.mid });
          }
        });
      }

      return result;
    };

    const config = GxyJanus.instanceConfig(room.janus);

    janus          = new JanusMqtt(user, config.name);
    janus.onStatus = (srv, status) => {
      if (status === 'offline') {
        alert('Janus Server - ' + srv + ' - Offline');
        get().exitRoom();
      }

      if (status === 'error') {
        console.error('[client] Janus error, reconnecting...');
        /*this.exitRoom(true, () => {
          this.reinitClient(retry)
        })*/
      }
    };

    /**
     * publish my video stream to the room
     */
    videoroom = new PublisherPlugin(config.iceServers);
    videoroom.subTo     = (pubs) => makeSubscription(pubs).then(() => {
      const { rfid } = useUserStore.getState();
      sendUserState({ camera: cammmute, question, rfid, room: room.room });
    });
    videoroom.unsubFrom = (ids, onlyVideo) => {
      const streams = [];
      ids.forEach(id => {
        const feed = get().memberByFeed[id];
        if (!feed) return;

        if (onlyVideo) {
          // Unsubscribe only from one video stream (not all publisher feed).
          // Acutally expecting only one video stream, but writing more generic code.
          feed.streams
            .filter((stream) => stream.type === 'video')
            .map((stream) => ({ feed: feed.id, mid: stream.mid }))
            .forEach((stream) => streams.push(stream));
        } else {
          // Unsubscribe the whole feed (all it's streams).
          streams.push({ feed: feed.id });
          log.info('[client] Feed ' + JSON.stringify(feed) + ' (' + feed.id + ') has left the room, detaching');
        }
      });
      // Send an unsubscribe request.
      if (_subscriberJoined && streams.length > 0) {
        subscriber.unsub(streams);
      }
      if (!onlyVideo) {
        set(produce(state => {
          ids.forEach(id => {
            state.memberByFeed[id] && delete state.memberByFeed[id];
          });
        }));
      }
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
        set(produce(state => {
          if (!state.memberByFeed[id])
            state.memberByFeed[id] = {};

          state.memberByFeed[id].mid = track.id;
          if (track.kind === 'audio') {
            log.debug('[client] Created remote audio stream:', stream);
          } else if (track.kind === 'video') {
            log.debug('[client] Created remote video stream:', stream);
            state.memberByFeed[id].url = stream.toURL();
          }
        }));
      }
    };

    subscriber.onUpdate = (streams) => set(produce(state => {
        log.debug('[client] Updated streams :', streams);
        streams?.forEach((s) => {
          if (state.memberByFeed[s.feed_id])
            state.memberByFeed[s.feed_id].mid = s.mid;
        });
      },
    ));

    janus.init(config.token).then((data) => {
      log.info('[client] Janus init', data);
      janus.attach(videoroom).then((data) => {
        console.info('[client] Publisher Handle: ', data);

        //const { video: { device } } = media

        //user.camera = !!device && cammuted === false
        user.question  = false;
        user.timestamp = Date.now();
        user.session   = janus.sessionId;
        user.handle    = videoroom.janusHandleId;

        //this.setState({ janus, videoroom, user, room: selected_room })

        //this.micMute()

        const { id, timestamp, role, username } = user;
        const d                                 = {
          id,
          timestamp,
          role      : userRolesEnum.user,
          display   : username,
          is_group  : false,
          is_desktop: false,
        };
        videoroom.join(room.room, d).then(async (data) => {
          log.info('[client] Joined respond :', data);
          useUserStore.getState().setRfid(data.id);

          // Feeds count with user role
          let feeds_count = data.publishers.filter((feed) => feed.display.role === userRolesEnum.user).length;
          if (feeds_count > 25) {
            alert(t('oldClient.maxUsersInRoom'));
            //this.exitRoom(false)
            return;
          }

          makeSubscription(data.publishers);

          const stream = getStream();
          stream.getAudioTracks().forEach(track => track.enabled = false);

          console.log('videoroom published stream after', stream.getVideoTracks()[0]);
          return videoroom.publish(stream).then((json) => {
            log.debug('[client] videoroom published', json);
            //user.extra.streams = json.streams;
            //user.extra.isGroup = this.state.isGroup;

            const vst = json.streams.find((v) => v.type === 'video' && v.h264_profile);
            if (vst && vst?.h264_profile !== '42e01f') {
              //captureMessage('h264_profile', vst)
            }

            //this.setState({ user, myid: id, delay: false, sourceLoading: false });
            //updateSentryUser(user)
            //updateGxyUser(user)
            //this.keepAlive();

            mqtt.join('galaxy/room/' + room.room);
            mqtt.join('galaxy/room/' + room.room + '/chat', true);
            //if (isGroup) videoroom.setBitrate(600000)
          }).catch((err) => {
            log.error('[client] Publish error :', err);
            //this.exitRoom(false)
          });
        }).catch((err) => {
          log.error('[client] Join error :', err);
          // this.exitRoom(false)
        });
      });

      janus.attach(subscriber).then((data) => {
        console.info('[client] Subscriber Handle: ', data);
      });
    }).catch((err) => {
      log.error('[client] Janus init', err);
      /*this.exitRoom(true, () => {
        this.reinitClient(retry)
      })*/
    });

    mqtt.join('galaxy/room/' + room.room);
    mqtt.join('galaxy/room/' + room.room + '/chat', true);
  },
  exitRoom    : async () => {
    const { room } = useRoomStore.getState();

    await videoroom?.leave();
    videoroom = null;
    subscriber?.detach();
    subscriber = null;
    janus?.destroy();
    janus = null;
    useSettingsStore.getState().setReadyForJoin(false);

    mqtt.exit('galaxy/room/' + room.room);
    mqtt.exit('galaxy/room/' + room.room + '/chat');
    InCallManager.stop();
    InCallManager.setKeepScreenOn(false);
    //KeepAwakeModule.deactivate();
  },
  toggleMute  : (stream) => {
    videoroom.mute(null, stream);
  },
  activatePage: async (page) => {
    const forActivate = Object.values(this.memberByFeed).slice(page * MEMBER_PER_PAGE, (page + 1) * MEMBER_PER_PAGE);
    await deactivateFeeds(activeFeeds);
    return activateFeeds(forActivate);
  }
}));

const activateFeeds = (feeds) => {
  const streams = [];
  for (const f of feeds) {
    const v_streams = f.streams?.filter((s) => (s.type === 'video' && s.codec === 'h264' && (s.h264_profile !== '42e01f')));
    streams.push(...v_streams);
  }

  if (streams.length === 0)
    return Promise.resolve();

  return subscriber.sub(streams);
};

const deactivateFeeds = (feeds) => {
  const streams = [];
  for (const f of feeds) {
    const v_streams = f.streams?.filter((s) => (s.type === 'video' && s.codec === 'h264' && (s.h264_profile !== '42e01f')));
    streams.push(...v_streams);
  }

  if (streams.length === 0)
    return Promise.resolve();

  return subscriber.unsub(streams);
};