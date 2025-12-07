import * as React from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import useRoomStore from '../zustand/fetchRooms';
import { useSettingsStore } from '../zustand/settings';
import { useUiActions } from '../zustand/uiActions';

import { AudioDevicesBtn } from './AudioDevicesBtn';
import { LeaveBtn } from './LeaveBtn';
import { TopMenuBtn } from './TopMenuBtn';
export const TopBar = () => {
  const insets = useSafeAreaInsets();
  const { room } = useRoomStore();
  const { toggleShowBars, showBars } = useUiActions();
  const { isFullscreen } = useSettingsStore();

  if (!showBars || isFullscreen) return null;

  const handleAnyPress = () => toggleShowBars(false, true);

  return (
    <TouchableWithoutFeedback onPress={handleAnyPress}>
      <View
        style={[
          styles.container,
          baseStyles.topBar,
          {
            borderTopWidth: insets.top,
            marginTop: -insets.top,
            borderLeftWidth: insets.left,
            borderRightWidth: insets.right,
          },
        ]}
      >
        <View style={styles.left}>
          <TopMenuBtn />
          <AudioDevicesBtn />
        </View>
        <View>
          <Text style={baseStyles.text}>{room?.description}</Text>
        </View>
        {/* placeholder - will delete later */}
        <View><Text>"    "</Text></View>
        {/* <LeaveBtn /> */}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    zIndex: 1000,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
