import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from './MyRTCView';
import { useMyStreamStore } from '../zustand/myStream';
import { memberItemWidth } from '../InRoom/helper';

const MyMedia = () => {
  const { cammute } = useMyStreamStore();

  return (
    <View style={[styles.container, { aspectRatio: memberItemWidth.getAspectRatio(), maxWidth: '100%' }]}>
      {cammute && <View style={styles.overlay} />}
      <MyRTCView />
    </View>
  );
};
export default MyMedia;

const styles = StyleSheet.create({
  container: {
    flex : 1,
    width: '100%'
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
