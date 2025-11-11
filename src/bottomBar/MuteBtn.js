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
  return (
    <Pressable onPress={handlePress} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName={mute ? 'mic-off' : 'mic'}
        text={mute ? t('bottomBar.unmute') : t('bottomBar.mute')}
        extraStyle={mute ? ['pressed','pressedicon'] : ['rest','resticon']} />
    </Pressable>
  );
};
