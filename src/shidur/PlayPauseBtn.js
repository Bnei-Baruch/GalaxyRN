import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from '../topBar/helper';
import { useShidurStore } from '../zustand/shidur';
import { useUiActions } from '../zustand/uiActions';

export const PlayPauseBtn = () => {
  const { isPlay, toggleIsPlay } = useShidurStore();
  const { toggleShowBars } = useUiActions();

  const toggle = () => {
    toggleIsPlay();
    toggleShowBars(false);
  };

  return (
    <TouchableOpacity onPress={toggle} style={[topMenuBtns.btn, topMenuBtns.firstBtn]}>
      <Icon name={isPlay ? 'stop' : 'play-arrow'} size={30} color="white" />
    </TouchableOpacity>
  );
};
