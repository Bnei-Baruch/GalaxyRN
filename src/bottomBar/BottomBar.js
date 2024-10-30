import * as React from 'react';
import { StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import { MuteBtn } from './MuteBtn';
import { CammuteBtn } from './CammuteBtn';
import { QuestionBtn } from './QuestionBtn';
import { AudioModeBtn } from './AudioModeBtn';
import { MoreBtn } from './MoreBtn';
import { useInRoomStore } from '../zustand/inRoom';

export const BottomBar = () => {
  const { showBars, setShowBars } = useInRoomStore();

  if (showBars) return null;

  const handleAnyPress = () => setShowBars(true);

  return (
    <TouchableWithoutFeedback onPress={handleAnyPress}>
      <View style={styles.container}>
        <MuteBtn />
        <CammuteBtn />
        <QuestionBtn />
        <AudioModeBtn />
        <MoreBtn />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    flexDirection  : 'row',
    alignItems     : 'flex-start',
    justifyContent : 'space-between',
    padding        : 10,
    backgroundColor: 'black'
  }
});