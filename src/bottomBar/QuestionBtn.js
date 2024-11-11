import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../zustand/settings';
import { bottomBar } from './helper';

export const QuestionBtn = () => {
  const { question, toggleQuestion } = useSettingsStore();

  const handlePress = () => toggleQuestion();

  return (
    <TouchableOpacity onPress={handlePress} style={bottomBar.btn}>
      <Icon name="question-mark" size={40} color={question ? 'red' : 'white'} />
    </TouchableOpacity>
  );
};
