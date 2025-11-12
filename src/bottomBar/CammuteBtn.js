import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../settings/BottomBarIconWithText';
import { useMyStreamStore } from '../zustand/myStream';
import { bottomBar } from './helper';

export const CammuteBtn = () => {
  const { cammute, toggleCammute } = useMyStreamStore();
  const handlePress = () => toggleCammute();
  const { t } = useTranslation();
  let iconName, text, extraStyle;
  if (cammute) {
    iconName = 'videocam-off';
    text = t('bottomBar.stopVideo');
    extraStyle = ['pressed', 'pressedicon'];
  } else {
    iconName = 'videocam';
    text = t('bottomBar.startVideo');
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
