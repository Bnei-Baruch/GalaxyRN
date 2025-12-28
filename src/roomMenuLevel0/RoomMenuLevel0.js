import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';
import { BottomBar } from './BottomBar';
import { TopBar } from './TopBar';

export const RoomMenuLevel0 = () => {
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
        { top: insets.top + 8 },
        { left: insets.left + 8 },
        { right: insets.right + 8 },
      ]}
    >
      <TopBar />
      <BottomBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // left: 30,
    // right: 30,
    justifyContent: 'space-between',
    // top:0,
    alignItems: 'center',
    // backgroundColor:'red',
    zIndex: 100,
  },
});
