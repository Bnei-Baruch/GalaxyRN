import React from 'react';
import { StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { NO_VIDEO_OPTION_VALUE } from '../consts';
import logger from '../services/logger';
import { useMyStreamStore } from '../zustand/myStream';
import { useShidurStore } from '../zustand/shidur';

const MyRTCView = () => {
  const { stream } = useMyStreamStore();
  const { url, video } = useShidurStore();
  logger.debug('pip ios', 'render MyRTCView', stream);

  if (!stream) return null;

  const isMyInPIP = video === NO_VIDEO_OPTION_VALUE || !url;

  return (
    <RTCView
      streamURL={stream?.toURL()}
      style={styles.rtcView}
      mirror={true}
      objectFit="contain"
      iosPIP={{
        enabled: isMyInPIP,
        stopAutomatically: false,
        preferredSize: {
          width: 100,
          height: 100,
        },
      }}
    />
  );
};

const styles = StyleSheet.create({
  rtcView: {
    flex: 1,
    width: '100%',
  },
});

export default MyRTCView;
