import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';
import { BottomBarBtns } from './BottomBarBtns';

export const BottomBar = () => {
  const { showBars } = useUiActions();
  const { isFullscreen } = useSettingsStore();
  const insets = useSafeAreaInsets();

  if (!showBars || isFullscreen) return null;

  return (
    <View
      style={[
        styles.container,
        {
          bottom:
            Platform.OS === 'ios'
              ? Math.max(insets.bottom, 16)
              : insets.bottom + 8,
        },
        { left: insets.left + 8 },
        { right: insets.right + 8 },
      ]}
    >
      <BottomBarBtns />
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
