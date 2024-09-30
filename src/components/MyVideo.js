import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../zustand/settings';
import { Text, View, StyleSheet } from 'react-native';
//import styles from './VideoStyle';
import { useUserStore } from '../zustand/user';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RTCView } from 'react-native-webrtc';
import defaultDevices from '../shared/devices';

const MyMedia = () => {
  const [video, setVideo] = useState();

  const { user: { name } = {} }                     = useUserStore();
  const { muted, cammuted, question } = useSettingsStore();

  useEffect(() => {
    defaultDevices.getMediaStream(true, true).then(([m, err]) => {
      setVideo(m);
    });

  }, []);

  if (!video) return <Text>No device</Text>;

  console.log('MyMedia', video);

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <View style={styles.container}>
          {muted
            ? <Icon name="mic" size={30} color="red" />
            : ''}
          {name}
          <Icon name="signal-cellular-alt" size={30} />
        </View>
      </View>
      <RTCView
        streamURL={video.toURL()}
        style={styles.video}
        objectFit="cover"
        mirror={true}
      />
    </View>
  );
};
export default MyMedia;

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    overflow   : 'hidden',
  },
  video    : {
    height: 'content',
    right : '50%',
  },
});
