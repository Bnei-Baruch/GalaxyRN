import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { bottomBar } from '../../roomMenuLevel0/helper';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useSettingsStore } from '../../zustand/settings';

export const KliOlamiBtn = () => {
  const { isKliOlami, toggleIsKliOlami } = useSettingsStore();
  const { t } = useTranslation();

  const handlePress = () => toggleIsKliOlami();

  return (
    <Pressable onPress={handlePress} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName="public"
        text={t('bottomBar.kliOlami')}
        extraStyle={
          !isKliOlami
            ? ['toggle_off', 'toggle_off_icon']
            : ['toggle_on_alt2', 'toggle_on_icon_alt2']
        }
        showtext={true}
        direction={['vertical', 'horizontal']}
      />
    </Pressable>
  );
};
