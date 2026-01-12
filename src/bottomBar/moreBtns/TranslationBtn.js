import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useShidurStore } from '../../zustand/shidur';
import { bottomBar } from '../helper';
export const TranslationBtn = () => {
  const toggleIsOriginal = useShidurStore(state => state.toggleIsOriginal);
  const audio = useShidurStore(state => state.audio);
  const { t } = useTranslation();
  const isOriginal = audio?.key === 'wo_original';
  const toggle = () => toggleIsOriginal();
  return (
    <Pressable onPress={toggle} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName="translate"
        text={t('bottomBar.broacasttranslation')}
        extraStyle={
          isOriginal
            ? ['toggle_off', 'toggle_off_icon']
            : ['toggle_on_alt2', 'toggle_on_icon_alt2']
        }
        showtext={true}
        direction={['vertical', 'horizontal']}
      />
    </Pressable>
  );
};
