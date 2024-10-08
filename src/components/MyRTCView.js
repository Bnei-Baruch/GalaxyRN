import React from 'react';
import { StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useMyStreamStore } from '../zustand/myStream';

const MyRTCView = () => {
  const { url } = useMyStreamStore();

  return (
    <RTCView
      streamURL={url}
      style={styles.video}
      objectFit="cover"
      mirror={true}
    />
  );
};
export default MyRTCView;

const styles = StyleSheet.create({
  video: {
    position: 'absolute',
    top     : 0,
    left    : 0,
    bottom  : 0,
    right   : 0,
  },
});
