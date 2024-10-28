import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useShidurStore } from '../zustand/shidur';
import { PlayPauseBtn } from './PlayPauseBtn';
import { OptionsBtn } from './OptionsBtn';

/*
export default class Shidur extends Component {
  state = {
    video: null,
    audio: null,
    selectedVideo: 1,
    selectedAudio: 15,
  }

  componentDidMount = async () => {
    const user = { id: 'asdfaefadsfdfa234234', email: 'mail@mail.com' }
    this.initMQTT(user)
  }

  initMQTT = (user) => {
    mqtt.init(user, (data) => {
      console.log('[mqtt] init: ', data)
      mqtt.watch()

      let Janus = new JanusMqtt(user, 'str1')
      let videoStream = new StreamingPlugin()
      let audioStream = new StreamingPlugin()

      Janus.init().then(data => {
        console.log(data)
        Janus.attach(videoStream).then(data => {
          this.setState({ Janus, videoStream, user })
          videoStream.watch(1).then(stream => {
            console.log('GOT STREAM', stream)
            this.setState({ video: stream })
          })
        })
        Janus.attach(audioStream).then(data => {
          this.setState({ audioStream })
          console.log(data)
          audioStream.watch(15).then(stream => {
            this.setState({ audio: stream })
          })
        })
      })
    })
  }

  setStream = (selectedVideo) => {
    console.log('VIDEO', selectedVideo)
    this.setState({ selectedVideo })
    if (this.state.videoStream)
      this.state.videoStream.switch(Number(selectedVideo))
  }

  setAudio = (selectedAudio) => {
    console.log('AUDIO', selectedAudio)
    this.setState({ selectedAudio })
    if (this.state.audioStream)
      this.state.audioStream.switch(Number(selectedAudio))
  }

  render () {
    const { selectedVideo, selectedAudio, video } = this.state

    return (
      <SafeAreaView style={styles.container}>
        {/!*<Header title={title} />*!/}
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
              placeholder={{ label: 'Video:', value: null }}
              items={videos_options}
              onValueChange={(value) => this.setStream(value)}
              itemKey={selectedVideo}
            />
          </View>
          <View style={styles.audio}>
            <RNPickerSelect
              useNativeAndroidPickerStyle={false}
              placeholder={{ label: 'Language:', value: null }}
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
*/

export const Shidur = () => {
  const { videoUrl, init, ready, toggleTalking, talking } = useShidurStore();

  useEffect(() => {
    init();
  }, []);

  return (
    <View style={styles.container}>
      {
        ready ? (
          <RTCView
            streamURL={videoUrl}
            style={styles.viewer}
          />
        ) : <Text>still not ready</Text>
      }

      <View style={styles.toolbar}>
        <PlayPauseBtn />
        <OptionsBtn />
      </View>
      <Button
        title="toggle on air"
        onPress={toggleTalking}
        style={{ backgroundColor: talking ? 'red' : 'green' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red',
  },
  viewer   : {
    aspectRatio    : 16 / 9,
    height         : 'auto',
    backgroundColor: 'black',
    justifyContent : 'center',
    alignItems     : 'center',
  },
  toolbar  : {
    padding       : 4,
    flexDirection : 'row',
    justifyContent: 'space-between',
  },
  video    : {
    // flex:2
  },
  audio    : {
    marginRight: 1,
  },
});
