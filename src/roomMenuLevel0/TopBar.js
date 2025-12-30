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
      <View style={[styles.container, baseStyles.panelBackground,{
          paddingTop: Math.max(insets.top, 16),
          paddingLeft: Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12),
        },]}>
        <AudioDevicesBtn />
        <Text style={[baseStyles.text, styles.text]} numberOfLines={2}>
            {room?.description}
        </Text>
        <LeaveBtn />
      {/* <MuteBtn />
      <CammuteBtn />
      <QuestionBtn />
      <AudioModeBtn />
      <View style={styles.devider}></View>
      <MoreBtn /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // minWidth: 340,
    // maxWidth: '100%',
    flexDirection: 'row',
    paddingBottom: 16,
    
    // borderRadius: 32,
    alignItems: 'center',
  },
  // devider: {
  //   width: 1,
  //   backgroundColor: '#333',
  //   marginLeft: 4,
  //   marginRight: 4,
  //   marginTop: 16,
  //   marginBottom: 16,
  // },
  text: {
    flexGrow:10,
    textAlign: 'center',
    // backgroundColor: 'green',
    // marginHorizontal: 12,
    marginLeft: 8,
    marginRight: 8,
    // color: '#7f7f7f',
    // textAlign: 'center',
    // fontSize: 16,
  },
});
