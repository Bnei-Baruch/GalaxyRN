import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from './helper';
import { useChatStore, chatModes } from '../zustand/chat';

export const ChatBtn = () => {
  const { setChatMode, mode } = useChatStore();

  const handlePress = () => {
    const _mode = mode === chatModes.close ? chatModes.chat : chatModes.close;
    setChatMode(_mode);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={topMenuBtns.btn}>
      <Icon name="forum" size={30} color="black" />
    </TouchableOpacity>
  );
};
