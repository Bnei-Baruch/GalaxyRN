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
import { getUserMedia } from '../shared/tools';

let videoroom               = null;
let janus                   = null;
export const useInRoomStore = create((set) => ({
  memberByFeed: {},
  joinRoom    : () => {
    if (janus) {
      janus.destroy();
    }
    const { user } = useUserStore.getState();
    const { room }        = useRoomStore.getState();

    const makeSubscription = (pubs) => {
      log.info('Subscriber pubs: ', pubs);
      const subs = getSubscriptionFromPublishers(pubs);

      /*if (this.state.remoteFeed) {
        this.state.subscriber.sub(subscription);
        return;
      }*/

      /*if (this.state.creatingFeed) {
        setTimeout(() => {
          this.subscribeTo(subscription);
        }, 500);
        return;
      }*/

      //this.setState({creatingFeed: true});
      log.info('Subscriber before join: ', subs, room.room);
      subscriber.join(subs, room.room).then((data) => {
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

        //this.setState({remoteFeed: true, creatingFeed: false});
      });
    };

    const getSubscriptionFromPublishers = (pubs) => {
      const result = [];
      for (const pub of pubs) {
        console.info('getSubscriptionFromPublishers pub', pub);
        const prevFeed  = useInRoomStore.getState().memberByFeed[pub.id];
        const prevVideo = prevFeed?.streams?.find(
          (v) => v.type === 'video' && v.codec === 'h264');
        const prevAudio = prevFeed?.streams?.find(
          (a) => a.type === 'audio' && a.codec === 'opus');

        pub.streams.forEach((s) => {
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
        window.location.reload();
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
    videoroom.subTo     = makeSubscription;
    videoroom.unsubFrom = (ids, onlyVideo) => {
      const idsSet  = new Set(ids);
      const streams = [];
      Object.values(useInRoomStore.getState().memberByFeed).filter((feed) => idsSet.has(feed.id)).forEach((feed) => {
        if (onlyVideo) {
          // Unsubscribe only from one video stream (not all publisher feed).
          // Acutally expecting only one video stream, but writing more generic code.
          feed.streams.filter((stream) => stream.type === 'video').map((stream) => ({
            feed: feed.id,
            mid : stream.mid
          })).forEach((stream) => streams.push(stream));
        } else {
          // Unsubscribe the whole feed (all it's streams).
          streams.push({ feed: feed.id });
          log.info('[client] Feed ' + JSON.stringify(feed) + ' (' + feed.id +
            ') has left the room, detaching');
        }
      });
      // Send an unsubscribe request.
      /*const { remoteFeed } = this.state
      if (remoteFeed !== null && streams.length > 0) {
        subscriber.unsub(streams)
      }*/
      if (!onlyVideo) {
        //this.setState({ feeds: feeds.filter((feed) => !idsSet.has(feed.id)) })
      }
    };
    videoroom.talkEvent = (id, talking) => {
      //useInRoomStore.getState().memberByFeed[id].talking = talking;
    };

    /**
     * subscribe to members of the room
     */
    const subscriber    = new SubscriberPlugin(config.iceServers);
    subscriber.onTrack  = (track, stream, on) => {
      let mid  = track.id;
      let feed = stream.id;
      log.info('[client] >> This track is coming from feed ' + feed + ':',
        mid,
        track,
        stream);
      if (on) {
        set(produce(
          state => {
            if (!state.memberByFeed[feed])
              state.memberByFeed[feed] = {};

            state.memberByFeed[feed].mid = mid;
            if (track.kind === 'audio') {
              log.debug('[client] Created remote audio stream:', stream);
              state.memberByFeed[feed].audio = stream;
            } else if (track.kind === 'video') {
              log.debug('[client] Created remote video stream:', stream);
              state.memberByFeed[feed].video = stream;
            }
          },
        ));
      }
    };
    subscriber.onUpdate = (streams) => set(produce(state => {
        //const { mids } = this.state
        log.debug('[client] Updated streams :', streams);
        streams.forEach((s) => {
          state.memberByFeed[s.feed_id].mid = s.mid;
        });
      },
    ));
    //subscriber.iceFailed = this.iceFailed

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
            is_group  : false,//isGroup,
            is_desktop: true,
          };
          videoroom.join(room.room, d).then(async (data) => {
            log.info('[client] Joined respond :', data);

            // Feeds count with user role
            let feeds_count = data.publishers.filter((feed) => feed.display.role === userRolesEnum.user).length;
            if (feeds_count > 25) {
              alert(t('oldClient.maxUsersInRoom'));
              //this.exitRoom(false)
              return;
            }

            makeSubscription(data.publishers);

            // const { id, room } = data
            // user.rfid = data.id

            const stream = await getUserMedia();
            console.log('videoroom published stream before', stream.getVideoTracks()[0]);
            stream.getAudioTracks().forEach(t => t.enabled = true);
            stream.getVideoTracks().forEach(t => t.enabled = true);

            console.log('videoroom published stream after', stream.getVideoTracks()[0]);
            videoroom.publish(stream).then((json) => {
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
  exitRoom    : () => {
    console.log('useInRoomStore exitRoom', videoroom);
    const { room } = useRoomStore.getState();

    if (videoroom) {
      console.log('videoroom exit', videoroom);
      videoroom.leave();

      videoroom = null;
      janus?.destroy();
      useSettingsStore.getState().setReadyForJoin(false);
    } else {
      useSettingsStore.getState().setReadyForJoin(false);
    }

    mqtt.exit('galaxy/room/' + room.room);
    mqtt.exit('galaxy/room/' + room.room + '/chat');
  },
  toggleMute  : (stream) => {
    videoroom.mute(null, stream);
  }
}));
