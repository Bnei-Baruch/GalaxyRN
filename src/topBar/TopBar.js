import * as React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import { TopMenuBtn } from './TopMenuBtn';
import { MuteBtn } from './MuteBtn';
import useRoomStore from '../zustand/fetchRooms';
import { ChatBtn } from './ChatBtn';
import { useInRoomStore } from '../zustand/inRoom';
import { baseStyles } from '../constants';

export const TopBar = () => {
  const { room }                     = useRoomStore();
  const { showBars, toggleShowBars } = useInRoomStore();

  if (!showBars) return null;

  const handleAnyPress = () => toggleShowBars(false, true);

  return (
    <TouchableWithoutFeedback onPress={handleAnyPress}>
      <View style={styles.container}>
        <View style={styles.left}>
          <TopMenuBtn />
          <MuteBtn />
        </View>
        <View>
          <Text style={baseStyles.text}>{room?.description}</Text>
        </View>
        <ChatBtn />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position       : 'absolute',
    top            : 0,
    left           : 0,
    right          : 0,
    flexDirection  : 'row',
    alignItems     : 'center',
    justifyContent : 'space-between',
    padding        : 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex         : 1000
  },
  left     : {
    flexDirection: 'row',
    alignItems   : 'flex-start',
  }
});