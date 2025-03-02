import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { MuteBtn } from './MuteBtn';
import { CammuteBtn } from './CammuteBtn';
import { QuestionBtn } from './QuestionBtn';
import { AudioModeBtn } from './AudioModeBtn';
import { MoreBtn } from './MoreBtn';
import { useUiActions } from '../zustand/uiActions';

export const BottomBar = () => {
  const { showBars } = useUiActions();

  if (!showBars) return null;

  return (
    <View style={styles.container}>
      <MuteBtn />
      <CammuteBtn />
      <QuestionBtn />
      <AudioModeBtn />
      <MoreBtn />
    </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  }
});