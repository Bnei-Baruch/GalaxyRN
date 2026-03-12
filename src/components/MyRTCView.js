import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import logger from '../services/logger';
import { useMyStreamStore } from '../zustand/myStream';

const MyRTCView = memo(
  () => {
    const { stream } = useMyStreamStore();
    logger.debug('pip ios', 'render MyRTCView', stream);

    if (!stream) return null;

    return (
      <RTCView
        streamURL={stream?.toURL()}
        style={styles.rtcView}
        mirror={true}
        objectFit="contain"
        iosPIP={{
          enabled: true,
          stopAutomatically: false,
          preferredSize: {
            width: 100,
            height: 100,
          },
        }}
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
