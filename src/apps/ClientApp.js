import React, { Component, Fragment } from 'react'
import { View, SafeAreaView, StyleSheet, Dimensions, Button } from "react-native";
import mqtt from "../shared/mqtt";
import {JanusMqtt} from "../libs/janus-mqtt";
import {StreamingPlugin} from "../libs/streaming-plugin";
import {PublisherPlugin} from "../libs/publisher-plugin";
import { mediaDevices, RTCView } from "react-native-webrtc";
import LoginPage from "../shared/login";
import devices from "../shared/devices";
import { media_object, audiog_options, videos_options } from "../shared/consts";
import log from "loglevel";
import RNPickerSelect from "react-native-picker-select";

export default class ClientApp extends Component {
  state = {
    video: null,
    audio: null,
    selectedVideo: 1,
    selectedAudio: 15,
    stream: null,
    user: null,
    muted: false,
    camera_muted: false,
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
    // videoroom.subTo = this.makeSubscription;
    // videoroom.unsubFrom = this.unsubscribeFrom;
    // videoroom.talkEvent = this.handleTalking;
    // videoroom.iceFailed = this.iceFailed;

    // let subscriber = new SubscriberPlugin(config.iceServers);
    // subscriber.onTrack = this.onRemoteTrack;
    // subscriber.onUpdate = this.onUpdateStreams;
    // subscriber.iceFailed = this.iceFailed;

    janus.init().then((data) => {
      log.info("[client] Janus init", data);

      janus.attach(videoroom).then((data) => {
        log.info("[client] Publisher Handle: ", data);
        this.joinRoom(false, janus, videoroom, user);
      });

      // janus.attach(subscriber).then((data) => {
      //   this.setState({subscriber});
      //   log.info("[client] Subscriber Handle: ", data);
      // });
    })
      .catch((err) => {
        log.error("[client] Janus init", err);
      });
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

    //this.micMute();

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

        //this.makeSubscription(data.publishers);
      }).catch((err) => {
        log.error("[client] Publish error :", err);
        //this.exitRoom(false);
      });
    }).catch((err) => {
      log.error("[client] Join error :", err);
      //this.exitRoom(false);
    });
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
    const {stream,muted} = this.state;
    if (stream) {
      //if (muted) this.micVolume();
      stream.getAudioTracks()[0].enabled = muted;
      this.setState({muted: !muted});
    }
  };

  render() {
    const { user, selectedAudio, video , stream} = this.state

    let login = <LoginPage user={user} checkPermission={this.checkPermission} loading={true} />;

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
