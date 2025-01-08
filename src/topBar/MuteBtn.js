import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useShidurStore } from '../zustand/shidur';

export const MuteBtn = () => {
  const { isMuted, setIsMuted } = useShidurStore();

  const toggleMute = () => setIsMuted();

  return (
    <TouchableOpacity onPress={toggleMute}>
      <Icon
        name={isMuted ? 'volume-mute' : 'volume-up'}
        size={30}
        color="white"
        style={{ marginHorizontal: 5 }}
      />
    </TouchableOpacity>
  );
};
