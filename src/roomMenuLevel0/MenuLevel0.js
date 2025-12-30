import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';
import { BottomBar } from './BottomBar';
import { TopBar } from './TopBar';

export const MenuLevel0 = () => {
  const { showBars, toggleShowBars } = useUiActions();
  const { isFullscreen } = useSettingsStore();

  if (!showBars || isFullscreen) return null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.toggleblock} onPress={toggleShowBars}>
        <Text>Room Level 0 Menu</Text>
      </Pressable>
      <TopBar />
      <BottomBar />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
    bottom: 0,
    top: 0,
    left: 0,
    right: 0,
  },
  toggleblock: {
    position: 'absolute',
    bottom: 0,
    top: 0,
    left: 0,
    right: 0,
  },
});
