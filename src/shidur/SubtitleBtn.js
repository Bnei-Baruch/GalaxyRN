import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from '../bottomBar/moreBtns/helper';
import { useSubtitleStore } from '../zustand/subtitle';

export const SubtitleBtn = () => {
  const { toggleIsOpen, lastMsg, isOpen } = useSubtitleStore();

  if (!lastMsg?.slide) return null;

  const toggle = () => toggleIsOpen();

  return (
    <TouchableOpacity
      onPress={toggle}
      style={[topMenuBtns.btn, topMenuBtns.firstBtn]}
    >
      <Icon
        name={isOpen ? 'subtitles-off' : 'subtitles'}
        size={30}
        color={'white'}
      />
    </TouchableOpacity>
  );
};
