import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from './MyRTCView';
import { useMyStreamStore } from '../zustand/myStream';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../zustand/settings';
import { feedWidth } from '../InRoom/helper';

const MyRoomMedia = () => {
  const { cammute }       = useMyStreamStore();
  const { numFeedsInCol } = useSettingsStore();

  const width = feedWidth(numFeedsInCol);

  return (
    <View style={{ width }}>
      <View style={styles.contant}>
        {
          cammute ? (
            <View style={styles.overlay}>
              <Icon name="account-circle" size={80} color="white" />
            </View>
          ) : <MyRTCView />
        }
      </View>
    </View>
  );
};
export default MyRoomMedia;

const styles = StyleSheet.create({
  contant: {
    aspectRatio    : 16 / 9,
    alignItems     : 'center',
    justifyContent : 'center',
    backgroundColor: 'grey'
  },
  overlay: {
    alignItems    : 'center',
    justifyContent: 'center'
  }
});
