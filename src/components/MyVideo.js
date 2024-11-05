import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from './MyRTCView';
import { useMyStreamStore } from '../zustand/myStream';
import { memberItemWidth } from '../InRoom/helper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../zustand/settings';

const MyMedia = ({ isPortrait }) => {
  const { cammute }   = useMyStreamStore();
  const { audioMode } = useSettingsStore();

  return (
    <View style={[styles.container, { aspectRatio: memberItemWidth.getAspectRatio(isPortrait), maxWidth: '100%' }]}>
      {
        (cammute || audioMode) && (
          <View style={styles.overlay}>
            <Icon name="account-circle" size={150} color="white" />
          </View>
        )
      }
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
    flex           : 1,
    justifyContent : 'center',
    alignItems     : 'center'
  }
});
