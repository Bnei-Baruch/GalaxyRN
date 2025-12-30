import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { baseStyles } from '../constants';
import { useRoomStore } from '../zustand/fetchRooms';
import { LeaveBtn } from './topBarBtns/LeaveBtn';
import Text from '../components/CustomText';
import { AudioDevicesBtn } from './topBarBtns/AudioDevicesBtn';

export const TopBar = () => {
  const { room } = useRoomStore();
  const insets = useSafeAreaInsets();
  
  return (
    <View
      style={[
        styles.container,
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingBottom: 16,
    alignItems: 'center',
  },
  text: {
    flexGrow: 10,
    textAlign: 'center',
    marginLeft: 8,
    marginRight: 8,
  },
});
