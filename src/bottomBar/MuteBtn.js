import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../zustand/settings';
import { topMenuBtns } from '../topBar/helper';

export const MuteBtn = () => {
  const { muted, toggleMuted } = useSettingsStore();

  const handlePress = () => toggleMuted();

  return (
    <TouchableOpacity onPress={handlePress} style={topMenuBtns.btn}>
      <Icon name={muted ? 'mic' : 'mic-off'} size={30} color="red" />
    </TouchableOpacity>
  );
};
