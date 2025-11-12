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
      <View style={styles.devider}></View>
      <MoreBtn />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 8,
    left: 30,
    right: 30,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 32,
  },
  devider: {
    width: 1,
    backgroundColor: '#333',
    marginLeft: 4,
    marginRight: 4,
    marginTop: 16,
    marginBottom: 16,
  },
});
