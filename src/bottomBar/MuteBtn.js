import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMyStreamStore } from '../zustand/myStream';
import { bottomBar } from './helper';

export const MuteBtn = () => {
  const { mute, toggleMute } = useMyStreamStore();

  const handlePress = () => toggleMute();

  return (
    <TouchableOpacity onPress={handlePress} style={bottomBar.btn}>
      <Icon name={mute ? 'mic-off' : 'mic'} size={40} color={mute ? 'red' : 'white'} />
    </TouchableOpacity>
  );
};
