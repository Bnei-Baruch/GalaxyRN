import React from 'react';
import { RTCView } from 'react-native-webrtc';
import { useMyStreamStore } from '../zustand/myStream';
import { baseStyles } from '../constants';
import { useInitsStore } from '../zustand/inits';

const MyRTCView = () => {
  const { stream }     = useMyStreamStore();
  const { isPortrait } = useInitsStore();

  if (!stream) return null;

  return (
    <RTCView
      streamURL={stream.toURL()}
      style={[baseStyles.full, { aspectRatio: isPortrait ? 9 / 16 : 16 / 9 }]}
      mirror={true}
      objectFit="cover"
    />
  );
};
export default MyRTCView;
