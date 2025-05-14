import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useSettingsStore } from '../zustand/settings';
import { useShidurStore } from '../zustand/shidur';
import { useInRoomStore } from '../zustand/inRoom';

import { bottomBar } from './helper';

export const QuestionBtn = () => {
  const { question, toggleQuestion } = useSettingsStore();
  const { isPlay, isOnAir }          = useShidurStore();
  const { isRoomQuestion }          = useInRoomStore();

  const handlePress = () => toggleQuestion();

  const disabled = !isPlay || isOnAir || isRoomQuestion;

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
