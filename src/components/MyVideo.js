import React from 'react';
import { View, Dimensions } from 'react-native';
import MyRTCView from './MyRTCView';
import { useMyStreamStore } from '../zustand/myStream';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { baseStyles } from '../constants';

const MyVideo = ({ styles }) => {
  const { cammute } = useMyStreamStore();
  const { width, height } = Dimensions.get('window');
  const iconSize = Math.min(width, height) * 0.25; // 25% of the smallest screen dimension

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

