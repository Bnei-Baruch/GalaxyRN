import * as React from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import { baseStyles } from '../constants';
import useRoomStore from '../zustand/fetchRooms';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';

import { AudioDevicesBtn } from './AudioDevicesBtn';
import { LeaveBtn } from './LeaveBtn';
import { TopMenuBtn } from './TopMenuBtn';

export const TopBar = () => {
  const { room } = useRoomStore();
  const { toggleShowBars, showBars } = useUiActions();
  const { isFullscreen } = useSettingsStore();

  if (!showBars || isFullscreen) return null;

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
        <LeaveBtn />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
