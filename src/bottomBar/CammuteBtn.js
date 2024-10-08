import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from './helper';
import { useMyStreamStore } from '../zustand/myStream';

export const CammuteBtn = () => {
  const { cammute, toggleCammute } = useMyStreamStore();

  const handlePress = () => {
    toggleCammute();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={topMenuBtns.btn}>
      <Icon name={cammuted ? 'videocam' : 'videocam-off'} size={30} color="red" />
    </TouchableOpacity>
  );
};
