import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';
import { AudioModeBtn } from './AudioModeBtn';
import { CammuteBtn } from './CammuteBtn';
import { MoreBtn } from './MoreBtn';
import { MuteBtn } from './MuteBtn';
import { QuestionBtn } from './QuestionBtn';
import { baseStyles } from '../constants';

export const BottomBar = () => {
  const { showBars } = useUiActions();
  const { isFullscreen } = useSettingsStore();

  if (!showBars || isFullscreen) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.buttons, baseStyles.panelBackground]}>
        <MuteBtn />
        <CammuteBtn />
        <QuestionBtn />
        <AudioModeBtn />
        <View style={styles.devider}></View>
        <MoreBtn />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 16,
    alignItems: 'center',
  },
  buttons: {
    minWidth: 360,
    maxWidth: '100%',

    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
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
