import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useShidurStore } from '../zustand/shidur';
import { topMenuBtns } from '../topBar/helper';

export const PlayPauseBtn = () => {
  const { isPlay, toggleIsPlay } = useShidurStore();

  return (
    <TouchableOpacity onPress={toggleIsPlay} style={topMenuBtns.btn}>
      <Icon name={isPlay ? 'stop' : 'play-arrow'} size={30} color="white" />
    </TouchableOpacity>
  );
};
