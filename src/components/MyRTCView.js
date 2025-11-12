import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useMyStreamStore } from '../zustand/myStream';

const MyRTCView = memo(
  () => {
    const { stream } = useMyStreamStore();

    if (!stream) return null;

    return (
      <RTCView
        streamURL={stream.toURL()}
        style={styles.rtcView}
        mirror={true}
        objectFit="contain"
      />
    );
  },
  (prevProps, nextProps) => {
    return false;
  }
);

const styles = StyleSheet.create({
  rtcView: {
    flex: 1,
    width: '100%',
  },
});

export default MyRTCView;
