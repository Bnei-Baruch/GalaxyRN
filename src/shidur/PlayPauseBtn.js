import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useShidurStore } from '../zustand/shidur';
import { topMenuBtns } from '../topBar/helper';

export const PlayPauseBtn = () => {
  const { isPlay, toggleIsPlay, toggleShidurBar } = useShidurStore();

  const toggle = () => {
    toggleIsPlay();
    toggleShidurBar(false);
  };

  return (
    <TouchableOpacity onPress={toggle} style={[topMenuBtns.btn, topMenuBtns.firstBtn]}>
      <Icon name={isPlay ? 'stop' : 'play-arrow'} size={30} color="white" />
    </TouchableOpacity>
  );
};
