import React from 'react';
import { StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useMyStreamStore } from '../zustand/myStream';
import { baseStyles } from '../constants';
import { memberItemWidth } from '../InRoom/helper';

const MyRTCView = () => {
  const { url } = useMyStreamStore();

  return (
    <RTCView
      streamURL={url}
      style={[baseStyles.full, styles.video]}
      objectFit="cover"
      mirror={true}
    />
  );
};
export default MyRTCView;

const styles = StyleSheet.create({
  video: {
    aspectRatio: memberItemWidth.getAspectRatio()
  },
});
