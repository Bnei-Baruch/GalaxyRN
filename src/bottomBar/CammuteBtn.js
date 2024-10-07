import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from './helper';
import { useSettingsStore } from '../zustand/settings';
import { useInRoomStore } from '../zustand/in_room';

export const CammuteBtn = () => {
  const { cammuted, toggleCammuted } = useSettingsStore();

  const handlePress = () => {
    toggleCammuted(!cammuted);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={topMenuBtns.btn}>
      <Icon name={cammuted ? 'videocam' : 'videocam-off'} size={30} color="red" />
    </TouchableOpacity>
  );
};
