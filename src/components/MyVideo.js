import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from './MyRTCView';
import { useSettingsStore } from '../zustand/settings';

const MyMedia = () => {
  const { cammuted } = useSettingsStore();

  return (
    <View style={styles.container}>
      {cammuted && <View style={styles.overlay} />}
      <MyRTCView />
    </View>
  );
};
export default MyMedia;

const styles = StyleSheet.create({
  container: {
    aspectRatio: 9 / 16,
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
