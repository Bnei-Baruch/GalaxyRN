import * as React from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomBarIconWithText from '../settings/BottomBarIconWithText';
import { useSettingsStore } from '../zustand/settings';
import { bottomBar } from './helper';

export const AudioModeBtn = () => {
  const { audioMode, toggleAudioMode } = useSettingsStore();
 const { t } = useTranslation();
  const handlePress = () => toggleAudioMode();

  return (
    <Pressable onPress={handlePress} style={bottomBar.btn}>
        <BottomBarIconWithText iconName={audioMode ? "hearing" : "hearing"} text={audioMode ? t('bottomBar.hideBroadcast'): t('bottomBar.showBroadcast')} extraStyle={audioMode ? ['pressed','pressedicon'] : ['rest','resticon']}/>
    </Pressable>
  );
};
