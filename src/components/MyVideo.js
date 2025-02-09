import React from 'react';
import { View } from 'react-native';
import MyRTCView from './MyRTCView';
import { useMyStreamStore } from '../zustand/myStream';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { baseStyles } from '../constants';

const MyVideo = ({ styles }) => {
  const { cammute } = useMyStreamStore();

  return (
    <View style={styles}>
      {
        cammute ? (
          <View style={baseStyles.videoOverlay}>
            <Icon name="account-circle" size={150} color="white" />
          </View>
        ) : <MyRTCView />
      }
    </View>
  );
};
export default MyVideo;

