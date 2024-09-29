import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useShidurStore } from '../zustand/shidur';

export const MuteBtn = () => {
  const { mute, setMute } = useShidurStore();

  const toggleMute = () => {

  };

  return (
    <TouchableOpacity onPress={toggleMute}>
      <Icon name={mute ? 'volume-mute' : 'volume-up'} size={30} color="black" />
    </TouchableOpacity>
  );
};
