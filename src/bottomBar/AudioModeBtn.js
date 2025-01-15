import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../zustand/settings';
import { bottomBar } from './helper';

export const AudioModeBtn = () => {
  const { audioMode, toggleAudioMode } = useSettingsStore();

  const handlePress = () => toggleAudioMode();

  return (
    <TouchableOpacity onPress={handlePress} style={bottomBar.btn}>
      <Icon name="hearing" size={40} color={audioMode ? 'red' : 'white'} />
    </TouchableOpacity>
  );
};
