import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useUiActions } from '../zustand/uiActions';
import { BottomBar } from './BottomBar';

export const BottomBarLevel0 = () => {
  const { showBars } = useUiActions();

  if (!showBars) return null;

  return (
    <View style={styles.container}>
      <BottomBar />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 100,
    bottom: 0,
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
