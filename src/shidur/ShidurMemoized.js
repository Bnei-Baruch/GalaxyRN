import React, { memo } from 'react';
import { RTCView } from 'react-native-webrtc';
import logger from '../services/logger';
import { styles } from './styles';


const NAMESPACE = 'ShidurMemoized';

const ShidurMemoized = memo(
  ({ streamURL, style }) => {
    logger.debug(NAMESPACE, `ShidurMemoized render`, streamURL);
    return (
      <RTCView
        streamURL={streamURL}
        style={style || styles.viewer}
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
    return (
      prevProps.streamURL === nextProps.streamURL &&
      prevProps.style === nextProps.style
    );
  }
);

export default ShidurMemoized;
