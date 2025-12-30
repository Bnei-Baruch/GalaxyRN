import * as React from 'react';
import { Platform, StyleSheet, View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';
import { BottomBar } from './BottomBar';
import { TopBar } from './TopBar';

export const MenuLevel0 = () => {
  const { showBars, toggleShowBars } = useUiActions();
  const { isFullscreen } = useSettingsStore();
  const insets = useSafeAreaInsets();

  if (!showBars || isFullscreen) return null;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + 8,
          paddingTop: insets.top + 8,
          paddingLeft: insets.left + 8,
          paddingRight: insets.right + 8,
        },
      ]}
    >
      
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
    bottom:0,
    top:0,
    left:0,
    right:0,    
  },
  toggleblock:{
    // flex:1,
    // justifyContent:'center',
    // alignItems:'center',
    // backgroundColor:'green',
    position:'absolute',
    bottom:0,
    top:0,
    left:0,
    right:0, 
  }
});
