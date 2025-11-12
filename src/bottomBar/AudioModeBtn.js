import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../settings/BottomBarIconWithText';
import { useSettingsStore } from '../zustand/settings';
import { bottomBar } from './helper';

export const AudioModeBtn = () => {
  const { audioMode, toggleAudioMode } = useSettingsStore();
  const { t } = useTranslation();
  const handlePress = () => toggleAudioMode();
  let iconName, text, extraStyle;

  if (!audioMode) {
    iconName = 'hearing';
    text = t('bottomBar.showBroadcast');
    extraStyle = ['rest', 'resticon'];
  } else {
    iconName = 'hearing';
    text = t('bottomBar.hideBroadcast');
    extraStyle = ['pressed', 'pressedicon'];
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
