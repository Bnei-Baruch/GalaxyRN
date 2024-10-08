import React, { Component } from 'react'
import { View, SafeAreaView, StyleSheet } from 'react-native'
import mqtt from "../shared/mqtt";
import {JanusMqtt} from "../libs/janus-mqtt";
import {StreamingPlugin} from "../libs/streaming-plugin";
import {RTCView} from "react-native-webrtc";
import { audiog_options, videos_options } from "../shared/consts";
import RNPickerSelect from "react-native-picker-select";

export default class StreamApp extends Component {
  state = {
    video: null,
    audio: null,
    selectedVideo: 1,
    selectedAudio: 15
  }

  componentDidMount = async () => {
    const user = {id: "asdfaefadsfdfa234234", email: "mail@mail.com"}
    this.initMQTT(user)
  }

  initMQTT = (user) => {
    mqtt.init(user, (data) => {
      console.log("[mqtt] init: ", data);
      mqtt.watch();

      let Janus = new JanusMqtt(user, 'str1')
      let videoStream = new StreamingPlugin();
      let audioStream = new StreamingPlugin();

      Janus.init().then(data => {
        console.log(data)
        Janus.attach(videoStream).then(data => {
          this.setState({Janus, videoStream, user});
          videoStream.watch(1).then(stream => {
            console.log("GOT STREAM", stream)
            this.setState({video: stream})
          })
        })
        Janus.attach(audioStream).then(data => {
          this.setState({audioStream});
          console.log(data)
          audioStream.watch(15).then(stream => {
            this.setState({audio: stream})
          })
        })
      })
    });
  };

  setVideo = (selectedVideo) => {
    console.log("VIDEO", selectedVideo)
    this.setState({selectedVideo});
    if(this.state.videoStream)
      this.state.videoStream.switch(Number(selectedVideo));
  }

  setAudio = (selectedAudio) => {
    console.log("AUDIO", selectedAudio)
    this.setState({selectedAudio});
    if(this.state.audioStream)
      this.state.audioStream.switch(Number(selectedAudio));
  }

  render() {
    const { selectedVideo, selectedAudio, video } = this.state

    return (
      <SafeAreaView style={styles.container}>
        {/*<Header title={title} />*/}
        <RTCView
          streamURL={video?.toURL()}
          style={styles.viewer}
          // objectFit="cover"
          // mirror
        />
        <RTCView
          // streamURL={audio}
          //style={styles.viewer}
          // objectFit="cover"
          // mirror
        />
        <View style={styles.select}>
          <View style={styles.video}>
            <RNPickerSelect
              useNativeAndroidPickerStyle={false}
              placeholder={{label: "Video:", value: null}}
              items={videos_options}
              onValueChange={(value) => this.setVideo(value)}
              itemKey={selectedVideo}
            />
          </View>
          <View style={styles.audio}>
            <RNPickerSelect
              useNativeAndroidPickerStyle={false}
              placeholder={{label: "Language:", value: null}}
              items={audiog_options}
              onValueChange={(value) => this.setAudio(value)}
              itemKey={selectedAudio}
            />
          </View>
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#eaeaea',
  },
  viewer: {
    aspectRatio: 16/9,
    // marginTop: 16,
    height: 'auto',
    // width: '100%',
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  select: {
    padding: 24,
    flexDirection: 'row',
    justifyContent:'space-between',
    // justifyContent: 'left',
  },
  video: {
    // flex:2
  },
  audio: {
    marginRight: 1,
  }
});
