import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useShidurStore } from '../../zustand/shidur';
import { bottomBar } from '../helper';
export const BroadcastMuteBtn = () => {
  const { isMuted, setIsMuted } = useShidurStore();
  const toggleMute = () => setIsMuted();
  const { t } = useTranslation();
  return (
    <Pressable onPress={toggleMute} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName="volume-up"
        text={t('bottomBar.broadcastsound')}
        extraStyle={
          isMuted
            ? ['toggle_off', 'toggle_off_icon']
            : ['toggle_on_alt2', 'toggle_on_icon_alt2']
        }
        showtext={true}
        direction={['vertical', 'horizontal']}
      />
    </Pressable>
  );
};
