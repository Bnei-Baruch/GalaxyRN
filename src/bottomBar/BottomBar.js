import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';
import { AudioModeBtn } from './AudioModeBtn';
import { CammuteBtn } from './CammuteBtn';
import { MoreBtn } from './MoreBtn';
import { MuteBtn } from './MuteBtn';
import { QuestionBtn } from './QuestionBtn';

export const BottomBar = () => {
  const { showBars } = useUiActions();
  const { isFullscreen } = useSettingsStore();

  if (!showBars || isFullscreen) return null;

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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
});
