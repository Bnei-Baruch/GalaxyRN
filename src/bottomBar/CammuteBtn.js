import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMyStreamStore } from '../zustand/myStream';
import { bottomBar } from './helper';

export const CammuteBtn = () => {
  const { cammute, toggleCammute } = useMyStreamStore();

  const handlePress = () => toggleCammute();

  return (
    <TouchableOpacity onPress={handlePress} style={bottomBar.btn}>
      <Icon name={cammute ? 'videocam-off' : 'videocam'} size={40} color={cammute ? 'red' : 'white'} />
    </TouchableOpacity>
  );
};
