import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from './MyRTCView';
import { useMyStreamStore } from '../zustand/myStream';

const MyRoomMedia = () => {
  const { cammute } = useMyStreamStore();

  return (
    <View style={styles.container}>
      <View style={styles.contant}>
        {cammute && <View style={styles.overlay} />}
        <MyRTCView />

      </View>
    </View>
  );
};
export default MyRoomMedia;

const styles = StyleSheet.create({
  container: {
    width: '49%',
  },
  contant  : {
    aspectRatio    : 16 / 9,
    flex           : 1,
    alignItems     : 'center',
    justifyContent : 'center',
    backgroundColor: 'grey'
  },
  overlay  : {
    position       : 'absolute',
    top            : 0,
    left           : 0,
    bottom         : 0,
    right          : 0,
    zIndex         : 1,
    backgroundColor: 'grey',
  }
});
