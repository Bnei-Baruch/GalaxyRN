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
  return (
    <Pressable onPress={handlePress} style={bottomBar.btn}>
      <BottomBarIconWithText
       iconName={cammute ? 'videocam-off' : 'videocam'}
       text={cammute ? t('bottomBar.startVideo') : t('bottomBar.stopVideo')}
       extraStyle={cammute ? ['pressed','pressedicon'] : ['rest','resticon']}  />
    </Pressable>
  );
};
