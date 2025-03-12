import * as React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import { TopMenuBtn } from './TopMenuBtn';
import { AudioDevicesBtn } from './AudioDevicesBtn';
import useRoomStore from '../zustand/fetchRooms';
import { ChatBtn } from './ChatBtn';
import { baseStyles } from '../constants';
import { useUiActions } from '../zustand/uiActions';

export const TopBar = () => {
  const { room }                     = useRoomStore();
  const { toggleShowBars, showBars } = useUiActions();

  if (!showBars) return null;

  const handleAnyPress = () => toggleShowBars(false, true);

  return (
    <TouchableWithoutFeedback onPress={handleAnyPress}>
      <View style={styles.container}>
        <View style={styles.left}>
          <TopMenuBtn />
          <AudioDevicesBtn />
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