import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithTextAnimated';
import { useSubtitleStore } from '../../zustand/subtitle';
import { bottomBar } from '../helper';
export const SubtitleBtn = () => {
  const { toggleIsOpen, lastMsg, isOpen } = useSubtitleStore();
  const { t } = useTranslation();
  const toggle = () => toggleIsOpen();
  return (
    <Pressable onPress={toggle} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName="subtitles"
        text={t('bottomBar.broadcastsubtitles')}
        extraStyle={
          !isOpen
            ? ['toggle_off', 'toggle_off_icon']
            : ['toggle_on_alt2', 'toggle_on_icon_alt2']
        }
        showtext={true}
        direction={['vertical','horizontal']}
      />
    </Pressable>
  );
};
