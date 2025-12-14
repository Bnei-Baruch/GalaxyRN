import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';

export const BottomBar = ({ bottomBarBtns }) => {
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
      {bottomBarBtns}
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
});
