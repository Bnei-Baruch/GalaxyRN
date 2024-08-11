import React, { Component, Fragment } from 'react'
import { View, SafeAreaView, StyleSheet, Dimensions, Button } from "react-native";
import mqtt from "../shared/mqtt";
import {JanusMqtt} from "../libs/janus-mqtt";
import {StreamingPlugin} from "../libs/streaming-plugin";
import {PublisherPlugin} from "../libs/publisher-plugin";
import {SubscriberPlugin} from "../libs/subscriber-plugin";
import { mediaDevices, RTCView } from "react-native-webrtc";
import LoginPage from "../shared/login";
import devices from "../shared/devices";
import { media_object, audiog_options, videos_options } from "../shared/consts";
import log from "loglevel";
import RNPickerSelect from "react-native-picker-select";

export default class ClientApp extends Component {
  state = {
    creatingFeed: false,
    feeds: [],
    mids: [],
    janus: null,
    videoroom: null,
    remoteFeed: null,
    video: null,
    audio: null,
    selectedVideo: 1,
    selectedAudio: 15,
    stream: null,
    user: null,
    mic_muted: false,
    camera_muted: false,
    room: 1051
  }

  componentDidMount = async () => {
    const user = {id: "asdfaefadsfdfa234234", email: "mail@mail.com"}
    //this.initDevices()
  }

  checkPermission = (user) => {
    log.info(" :: user :: ", user);
    const allow = user.roles.indexOf("gxy_user");
    if (allow) {
      this.initApp(user);
    } else {
      alert("Access denied!");
    }
  };

  initApp = (user) => {
    this.setState({user});
    this.initDevices()
    this.initMQTT(user)
  }

  initDevices = () => {
    mediaDevices.getUserMedia({audio: true, video: {
        mandatory: {
          maxWidth: 320, // Provide your own width, height and frame rate here
          maxHeight: 180,
          maxFrameRate: 15,
        },
        facingMode: "user",
        optional: [],
      }})
      .then(stream => {
        this.setState({stream});
        log.info("VIDEO", stream.getVideoTracks()[0]);
        log.info("AUDIO", stream.getAudioTracks()[0]);
    })
  };

  initMQTT = (user) => {
    mqtt.init(user, (data) => {
      console.log("[mqtt] init: ", data);
      mqtt.watch();
      this.initJanus(user)
    });
  };

  initJanus = (user, config, retry) => {
    let janus = new JanusMqtt(user, "gxydev");

    let videoroom = new PublisherPlugin();
    videoroom.subTo = this.makeSubscription;
    videoroom.unsubFrom = this.unsubscribeFrom;
    videoroom.talkEvent = this.handleTalking;
    videoroom.iceFailed = this.iceFailed;

    let subscriber = new SubscriberPlugin();
    subscriber.onTrack = this.onRemoteTrack;
    subscriber.onUpdate = this.onUpdateStreams;
    subscriber.iceFailed = this.iceFailed;

    janus.init().then((data) => {
      log.info("[client] Janus init", data);

      janus.attach(videoroom).then((data) => {
        log.info("[client] Publisher Handle: ", data);
        this.joinRoom(false, janus, videoroom, user);
      });

      janus.attach(subscriber).then((data) => {
        this.setState({subscriber});
        log.info("[client] Subscriber Handle: ", data);
      });
    })
      .catch((err) => {
        log.error("[client] Janus init", err);
      });
  };

  iceFailed = (data) => {
    const {exit_room} = this.state;
    if(!exit_room && data === "publisher") {
      this.setState({show_notification: true});
      this.exitRoom();
      log.warn("[client] iceFailed for: ", data);
    }
  };

  joinRoom = (reconnect, janus, videoroom, user) => {
    this.setState({exit_room: false});
    let {selected_room, media, cammuted, isGroup} = this.state;

    user.camera = true;
    user.question = false;
    user.timestamp = Date.now();
    user.session = janus.sessionId;
    user.handle = videoroom.janusHandleId;

    this.setState({janus, videoroom, user, room: 1051});

    this.micMute();

    const {id, timestamp, role, username} = user;
    const d = {id, timestamp, role, display: username, is_group: isGroup, is_desktop: true};

    videoroom.join(1051, d).then((data) => {
      log.info("[client] Joined respond :", data);

      // Feeds count with user role
      // let feeds_count = userFeeds(data.publishers).length;
      // if (feeds_count > 25) {
      //   alert(t("oldClient.maxUsersInRoom"));
      //   this.exitRoom(false);
      //   return;
      // }

      const {id, room} = data;
      user.rfid = data.id;

      const {stream} = this.state;
      videoroom.publish(stream).then((json) => {
        // user.extra.streams = json.streams;
        // user.extra.isGroup = this.state.isGroup;

        const vst = json.streams.find((v) => v.type === "video" && v.h264_profile);
        if(vst && vst?.h264_profile !== "42e01f") {
          // captureMessage("h264_profile", vst);
        }

        this.setState({user, myid: id, delay: false, sourceLoading: false});
        // updateSentryUser(user);
        // updateGxyUser(user);

        mqtt.join("galaxy/room/" + 1051);
        mqtt.join("galaxy/room/" + 1051 + "/chat", true);
        //if(isGroup) videoroom.setBitrate(600000);

        log.info("[client] Pulbishers list: ", data.publishers);

        this.makeSubscription(data.publishers);
      }).catch((err) => {
        log.error("[client] Publish error :", err);
        //this.exitRoom(false);
      });
    }).catch((err) => {
      log.error("[client] Join error :", err);
      //this.exitRoom(false);
    });
  };

  exitRoom = (reconnect, callback) => {
    this.setState({delay: true, exit_room: true});
    const {videoroom} = this.state;

    if(videoroom) {
      videoroom.leave().then((data) => {
        log.info("[client] leave respond:", data);
        this.resetClient(reconnect, callback);
      }).catch(e => {
        this.resetClient(reconnect, callback);
      });
    } else {
      this.resetClient(reconnect, callback);
    }
  };

  resetClient = (reconnect, callback) => {
    let {janus, room, shidur} = this.state;

    //this.clearKeepAlive();

    localStorage.setItem("question", false);

    const params = {with_num_users: true};
    api.fetchAvailableRooms(params).then(data => {
      const {rooms} = data;
      this.setState({rooms});
    }).catch((err) => {
      log.error("[client] Error exiting room", err);
    });

    mqtt.exit("galaxy/room/" + room);
    mqtt.exit("galaxy/room/" + room + "/chat");

    if(shidur && !reconnect) {
      JanusStream.destroy();
    }

    if(!reconnect && isFullScreen()) {
      toggleFullScreen();
    }

    if(janus) janus.destroy();

    this.setState({
      muted: false,
      question: false,
      feeds: [],
      mids: [],
      localAudioTrack: null,
      localVideoTrack: null,
      remoteFeed: null,
      videoroom: null,
      subscriber: null,
      janus: null,
      delay: reconnect,
      room: reconnect ? room : "",
      chatMessagesCount: 0,
      isSettings: false,
      sourceLoading: true
    });

    if(typeof callback === "function") callback();
  }

  makeSubscription = (newFeeds) => {
    log.info("[client] makeSubscription", newFeeds);
    const subscription = [];
    const {feeds: prevFeeds, muteOtherCams} = this.state;
    const prevFeedsMap = new Map(prevFeeds.map((f) => [f.id, f]));

    newFeeds.forEach((feed) => {
      const {id, streams} = feed;
      feed.display = JSON.parse(feed.display);
      const vst = streams.find((v) => v.type === "video" && v.h264_profile);
      if(vst) {
        feed.video = vst.h264_profile === "42e01f";
      } else {
        feed.video = !!streams.find((v) => v.type === "video" && v.codec === "h264");
      }
      feed.audio = !!streams.find((a) => a.type === "audio" && a.codec === "opus");
      feed.data = !!streams.find((d) => d.type === "data");
      feed.cammute = !feed.video;

      const prevFeed = prevFeedsMap.get(feed.id);
      const prevVideo = !!prevFeed && prevFeed.streams?.find((v) => v.type === "video" && v.codec === "h264");
      const prevAudio = !!prevFeed && prevFeed.streams?.find((a) => a.type === "audio" && a.codec === "opus");

      streams.forEach((stream) => {
        let hasVideo = !muteOtherCams && stream.type === "video" && stream.codec === "h264" && !prevVideo;
        const hasAudio = stream.type === "audio" && stream.codec === "opus" && !prevAudio;
        if(stream?.h264_profile && stream?.h264_profile !== "42e01f") {
          hasVideo = false;
        }

        if (hasVideo || hasAudio || stream.type === "data") {
          prevFeedsMap.set(feed.id, feed);
          subscription.push({feed: id, mid: stream.mid});
        }
      });
    });
    const feeds = Array.from(prevFeedsMap, ([k, v]) => v);
    this.setState({feeds});
    if (subscription.length > 0) {
      this.subscribeTo(subscription);
      // Send question event for new feed, by notifying all room.
      // FIXME: Can this be done by notifying only the joined feed?
      // setTimeout(() => {
      //   if (this.state.question || this.state.cammuted) {
      //     sendUserState(this.state.user);
      //   }
      // }, 3000);
    }
  };

  unsubscribeFrom = (ids, onlyVideo) => {
    const {feeds} = this.state;
    const idsSet = new Set(ids);
    const streams = [];
    feeds
      .filter((feed) => idsSet.has(feed.id))
      .forEach((feed) => {
        if (onlyVideo) {
          // Unsubscribe only from one video stream (not all publisher feed).
          // Acutally expecting only one video stream, but writing more generic code.
          feed.streams
            .filter((stream) => stream.type === "video")
            .map((stream) => ({feed: feed.id, mid: stream.mid}))
            .forEach((stream) => streams.push(stream));
        } else {
          // Unsubscribe the whole feed (all it's streams).
          streams.push({feed: feed.id});
          log.info("[client] Feed " + JSON.stringify(feed) + " (" + feed.id + ") has left the room, detaching");
        }
      });
    // Send an unsubscribe request.
    const {remoteFeed} = this.state;
    if (remoteFeed !== null && streams.length > 0) {
      this.state.subscriber.unsub(streams);
    }
    if (!onlyVideo) {
      this.setState({feeds: feeds.filter((feed) => !idsSet.has(feed.id))});
    }
  };

  subscribeTo = (subscription) => {
    if (this.state.remoteFeed) {
      this.state.subscriber.sub(subscription);
      return;
    }

    if (this.state.creatingFeed) {
      setTimeout(() => {
        this.subscribeTo(subscription);
      }, 500);
      return;
    }

    this.setState({creatingFeed: true});

    this.state.subscriber.join(subscription, this.state.room).then((data) => {
      log.info("[client] Subscriber join: ", data);

      this.onUpdateStreams(data.streams);

      this.setState({remoteFeed: true, creatingFeed: false});
    });
  };

  handleTalking = (id, talking) => {
    const {feeds} = this.state;
    for (let i = 0; i < feeds.length; i++) {
      if (feeds[i] && feeds[i].id === id) {
        feeds[i].talking = talking;
      }
    }
    this.setState({feeds});
  };

  onUpdateStreams = (streams) => {
    const {mids} = this.state;
    log.debug("[client] Updated streams :", streams);
    for (let i in streams) {
      let mindex = streams[i]["mid"];
      //let feed_id = streams[i]["feed_id"];
      mids[mindex] = streams[i];
    }
    this.setState({mids});
  };

  onRemoteTrack = (track, stream, on) => {
    let mid = track.id;
    let feed = stream.id;
    log.info("[client] >> This track is coming from feed " + feed + ":", mid, track);
    if (on) {
      if (track.kind === "audio") {
        log.debug("[client] Created remote audio stream:", stream);
      } else if (track.kind === "video") {
        const {feeds} = this.state;
        for (let i = 0; i < feeds.length; i++) {
          if (feeds[i] && feeds[i].id === feed) {
            feeds[i].stream = stream;
          }
        }
        this.setState({ feeds });
      }
    }
  };

  cameraMute = () => {
    const {stream,camera_muted} = this.state;
    if (stream) {
      //if (muted) this.micVolume();
      stream.getVideoTracks()[0].enabled = camera_muted;
      this.setState({camera_muted: !camera_muted});
    }
  };

  micMute = () => {
    const {stream,mic_muted} = this.state;
    if (stream) {
      //if (muted) this.micVolume();
      stream.getAudioTracks()[0].enabled = mic_muted;
      this.setState({mic_muted: !mic_muted});
    }
  };

  render() {
    const { user, feeds, video , stream} = this.state

    let login = <LoginPage user={user} checkPermission={this.checkPermission} loading={true} />;

    let remote_feeds = feeds.map((feed, i) => {
      const {stream} = feed;
      return (
        <View style={styles.container} key={i}>
          <RTCView
            streamURL={stream?.toURL()}
            style={styles.remoteView}
            objectFit="contain"
          />
        </View>
      )
    })

    let content = <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <RTCView
          streamURL={stream?.toURL()}
          style={styles.selfView}
          objectFit="contain"
          mirror
        />
      </View>
      <View style={styles.middle}>
        <Button title="MicMute" onPress={this.micMute} />
      </View>
      <View style={styles.bottom}>
        <Button title="cametaMute" onPress={this.cameraMute} />
        {remote_feeds}
      </View>
    </SafeAreaView>

    return (
      <Fragment>
        {user ? content : login}
      </Fragment>
    )
  }
}

const styles = StyleSheet.create({
  selfView: {
    height: '100%',
    width: '100%',
  },
  viewer: {
    aspectRatio: 9/16,
    // marginTop: 16,
    height: 'auto',
    // width: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteView: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height/2.35
  },
  container: {
    flex: 0.7,
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
    margin: 10,
  },
  top: {
    flex: 0.3,
    backgroundColor: 'grey',
    borderWidth: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  middle: {
    flex: 0.3,
    backgroundColor: 'beige',
    borderWidth: 5,
  },
  bottom: {
    flex: 0.3,
    backgroundColor: 'pink',
    borderWidth: 5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});
