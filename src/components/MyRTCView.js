import React, { memo } from 'react';
import { RTCView } from 'react-native-webrtc';
import { baseStyles } from '../constants';
import { useInitsStore } from '../zustand/inits';
import { useMyStreamStore } from '../zustand/myStream';

const MyRTCView = memo(
  () => {
    const { stream } = useMyStreamStore();
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
  },
  (prevProps, nextProps) => {
    return false;
  }
);

export default MyRTCView;
