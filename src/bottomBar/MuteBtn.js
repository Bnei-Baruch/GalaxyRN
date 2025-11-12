import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../settings/BottomBarIconWithText';
import { useMyStreamStore } from '../zustand/myStream';
import { bottomBar } from './helper';

export const MuteBtn = () => {
  const { mute, toggleMute } = useMyStreamStore();
  const handlePress = () => toggleMute();
  const { t } = useTranslation();
  let iconName, text, extraStyle;
  if (mute) {
    iconName = 'mic-off';
    text = t('bottomBar.unmute');
    extraStyle = ['pressed', 'pressedicon'];
  } else {
    iconName = 'mic';
    text = t('bottomBar.mute');
    extraStyle = ['rest', 'resticon'];
  }
  return (
    <Pressable onPress={handlePress} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName={iconName}
        text={text}
        extraStyle={extraStyle}
      />
    </Pressable>
  );
};
