import React from 'react';
import { Dimensions, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { baseStyles } from '../constants';
import logger from '../services/logger';
import { useMyStreamStore } from '../zustand/myStream';
import MyRTCView from './MyRTCView';

const MyVideo = ({ styles }) => {
  const { cammute } = useMyStreamStore();
  const { width, height } = Dimensions.get('window');
  const iconSize = Math.min(width, height) * 0.25; // 25% of the smallest screen dimension

  logger.debug('MyVideo', 'render', cammute);
  return (
    <View style={styles}>
      {
        cammute ? (
          <View style={baseStyles.videoOverlay}>
            <Icon name="account-circle" size={iconSize} color="white" />
          </View>
        ) : <MyRTCView />
      }
    </View>
  );
};
export default MyVideo;

