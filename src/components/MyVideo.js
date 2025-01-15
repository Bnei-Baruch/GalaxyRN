import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from './MyRTCView';
import { useMyStreamStore } from '../zustand/myStream';
import { memberItemWidth } from '../InRoom/helper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { baseStyles } from '../constants';

const MyVideo = () => {
  const { cammute } = useMyStreamStore();

  return (
    <View style={[styles.container, { aspectRatio: memberItemWidth.getAspectRatio() }]}>
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

const styles = StyleSheet.create({
  container: {
    flex : 1,
    width: '100%'
  }
});
