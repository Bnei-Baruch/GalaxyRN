import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from './MyRTCView';
import { useMyStreamStore } from '../zustand/myStream';

const MyMedia = () => {
  const { cammute } = useMyStreamStore();

  return (
    <View style={styles.container}>
      {cammute && <View style={styles.overlay} />}
      <MyRTCView />
    </View>
  );
};
export default MyMedia;

const styles = StyleSheet.create({
  container: {
    aspectRatio: 9 / 16,
    width      : '10%'
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
