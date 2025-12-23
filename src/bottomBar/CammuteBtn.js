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
    extraStyle = ['toggle_on', 'toggle_on_icon'];
  } else {
    iconName = 'videocam';
    text = t('bottomBar.startVideo');
    extraStyle = ['toggle_off', 'toggle_off_icon'];
  }
  return (
    <Pressable onPress={handlePress} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName={iconName}
        text={text}
        extraStyle={extraStyle}
        showtext={false}
      />
    </Pressable>
  );
};
