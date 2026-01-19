import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import { useRoomStore } from '../zustand/fetchRooms';
import { useUiActions } from '../zustand/uiActions';
import { AudioDevicesBtn } from './topBarBtns/AudioDevicesBtn';
import { LeaveBtn } from './topBarBtns/LeaveBtn';

export const TopBar = () => {
  const { room } = useRoomStore();
  const { showBars } = useUiActions();
  const insets = useSafeAreaInsets();
  
  if (!showBars) return null;
  
  return (
    <View style={styles.container}>
    <View
      style={[
        styles.buttonsContainer,
        baseStyles.panelBackground,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingLeft: Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12),
        },
      ]}
    >
      <AudioDevicesBtn />
      <Text style={[baseStyles.text, styles.text]} numberOfLines={2}>
        {room?.description}
      </Text>
      <LeaveBtn />
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
  },
  text: {
    flexGrow: 10,
    textAlign: 'center',
    marginLeft: 8,
    marginRight: 8,
  },
});
