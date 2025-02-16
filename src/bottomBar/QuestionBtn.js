import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../zustand/settings';
import { bottomBar } from './helper';
import { useShidurStore } from '../zustand/shidur';

export const QuestionBtn = () => {
  const { question, toggleQuestion } = useSettingsStore();
  const { isPlay, isOnAir }          = useShidurStore();

  const handlePress = () => toggleQuestion();

  const disabled = !isPlay || isOnAir;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={bottomBar.btn}
      disabled={disabled}
    >
      <Icon
        name="question-mark"
        size={40}
        color={question ? 'red' : 'white'}
        style={disabled && { opacity: 0.5 }}
      />
    </TouchableOpacity>
  );
};
