import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useSettingsStore } from '../../zustand/settings';
import { bottomBar } from '../helper';
export const ShidurBtn = () => {
  const { isShidur, toggleIsShidur } = useSettingsStore();
  const { t } = useTranslation();
  return (
    <Pressable onPress={toggleIsShidur} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName="desktop-windows"
        text={t('bottomBar.shidur')}
        extraStyle={
          !isShidur
            ? ['toggle_off', 'toggle_off_icon']
            : ['toggle_on_alt2', 'toggle_on_icon_alt2']
        }
        showtext={true}
        direction={['vertical', 'vertical']}
      />
    </Pressable>
  );
};
