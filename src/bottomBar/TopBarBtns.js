import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { baseStyles } from '../constants';
import { useRoomStore } from '../zustand/fetchRooms';
import { AudioModeBtn } from './AudioModeBtn';
import { CammuteBtn } from './CammuteBtn';
import { MoreBtn } from './MoreBtn';
import { MuteBtn } from './MuteBtn';
import { QuestionBtn } from './QuestionBtn';
import { LeaveBtn } from './moreBtns/LeaveBtn';
import { useTranslation } from 'react-i18next';
import Text from '../components/CustomText';
import { AudioDevicesBtn } from './moreBtns/AudioDevicesBtn';

export const TopBarBtns = () => {
     const { t } = useTranslation();
     const { room } = useRoomStore();
  return (
      <View style={[styles.container, baseStyles.panelBackground]}>
        <AudioDevicesBtn />
        <Text style={[baseStyles.text, styles.text]} numberOfLines={1}>
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
    minWidth: 340,
    maxWidth: '100%',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 32,
    alignItems: 'center',
  },
  devider: {
    width: 1,
    backgroundColor: '#333',
    marginLeft: 4,
    marginRight: 4,
    marginTop: 16,
    marginBottom: 16,
  },
  text: {
    flexGrow:10,
    textAlign: 'center',
    // textAlign: 'center',
    // fontSize: 16,
  },
});
