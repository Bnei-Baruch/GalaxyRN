import * as React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { TopMenuBtn } from './TopMenuBtn';
import { MuteBtn } from './MuteBtn';
import useRoomStore from '../zustand/fetchRooms';
import Icon from 'react-native-vector-icons/MaterialIcons';

export const TopBar = () => {
  const { room } = useRoomStore();
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <TopMenuBtn />
        <MuteBtn />
      </View>
      <View>
        <Text>{room?.description}</Text>
      </View>

      <TouchableOpacity>
        <Icon name="forum" size={30} color="black" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection  : 'row',
    alignItems     : 'flex-start',
    justifyContent : 'space-between',
    padding        : 10,
    backgroundColor: 'orange',
    zIndex         : 1
  },
  left     : {
    flexDirection: 'row',
    alignItems   : 'flex-start',
  }
});