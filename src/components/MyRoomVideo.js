import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from './MyRTCView';
import { useSettingsStore } from '../zustand/settings';
import { useInRoomStore } from '../zustand/in_room';
import { getUserMedia } from '../shared/tools';

const MyRoomMedia = () => {
  const { cammuted }   = useSettingsStore();
  const { toggleMute } = useInRoomStore();

  useEffect(() => {
    getUserMedia().then(toggleMute);
  }, [cammuted]);

  return (
    <View style={styles.container}>
      {cammuted && <View style={styles.overlay} />}
      <MyRTCView />
    </View>
  );
};
export default MyRoomMedia;

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
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
