import React from 'react';
import { RTCView } from 'react-native-webrtc';
import { useMyStreamStore } from '../zustand/myStream';
import { baseStyles } from '../constants';
import { feedWidth } from '../InRoom/helper';

const MyRTCView = () => {
  const { stream } = useMyStreamStore();

  if (!stream) return null;

  return (
    <RTCView
      streamURL={stream.toURL()}
      style={[baseStyles.full, { aspectRatio: feedWidth.getAspectRatio() }]}
      objectFit="cover"
      mirror={true}
    />
  );
};
export default MyRTCView;
