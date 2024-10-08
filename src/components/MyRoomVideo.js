import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from './MyRTCView';
import { useMyStreamStore } from '../zustand/myStream';

const MyRoomMedia = () => {
  const { cammute } = useMyStreamStore();

  return (
    <View style={styles.container}>
      {cammute && <View style={styles.overlay} />}
      <MyRTCView />
    </View>
  );
};
export default MyRoomMedia;

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    width      : '50%'
  },
  overlay  : {
    position       : 'absolute',
    top            : 0,
    left           : 0,
    bottom         : 0,
    right          : 0,
    zIndex         : 1,
    backgroundColor: 'black',
  }
});
