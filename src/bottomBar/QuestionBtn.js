import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../settings/BottomBarIconWithText';
// import { TouchableOpacity } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';

import { useInRoomStore } from '../zustand/inRoom';
import { useSettingsStore } from '../zustand/settings';
import { useShidurStore } from '../zustand/shidur';

import { bottomBar } from './helper';

export const QuestionBtn = () => {
  const { question, toggleQuestion } = useSettingsStore();
  const { isPlay, isOnAir } = useShidurStore();
  const { isRoomQuestion } = useInRoomStore();

  const handlePress = () => toggleQuestion();
  const { t } = useTranslation();
  const disabled = !isPlay || isOnAir || isRoomQuestion;
  const text = question ? t('bottomBar.qustionon') : t('bottomBar.qustionoff');
  const extraStyle = disabled
    ? ['disabled', 'disabledicon']
    : question
    ? ['pressedalt', 'pressediconalt']
    : ['rest', 'resticon'];

  return (
    <Pressable onPress={handlePress} style={bottomBar.btn} disabled={disabled}>
      <BottomBarIconWithText
        iconName={'live-help'}
        text={text}
        extraStyle={extraStyle}
      />
    </Pressable>
  );
};
