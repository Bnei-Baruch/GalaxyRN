import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from './MyRTCView';
import { useMyStreamStore } from '../zustand/myStream';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MyRoomMedia = () => {
  const { cammute } = useMyStreamStore();

  return (
    <View style={styles.container}>
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
  container: {
    width: '49%',
  },
  contant  : {
    aspectRatio    : 16 / 9,
    alignItems     : 'center',
    justifyContent : 'center',
    backgroundColor: 'grey'
  },
  overlay  : {
    alignItems     : 'center',
    justifyContent : 'center'
  }
});
