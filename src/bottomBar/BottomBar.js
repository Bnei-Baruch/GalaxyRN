import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { baseStyles } from '../constants';
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
  const insets = useSafeAreaInsets();
  if (!showBars || isFullscreen) return null;
  return (
    <View
      style={[
        styles.container,
        { bottom: Math.max(insets.bottom, 16) },
        { left: insets.left + 8 },
        { right: insets.right + 8 },
      ]}
    >
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
    left: 30,
    right: 30,
    alignItems: 'center',
    zIndex: 100,
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
