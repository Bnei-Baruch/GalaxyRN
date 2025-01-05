import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../../zustand/settings';
import IconWithText from '../../settings/IconWithText';
import { bottomBar } from '../helper';
import { useTranslation } from 'react-i18next';
import { baseStyles } from '../../constants';

export const ShidurBtn = () => {
  const { isShidur, toggleIsShidur } = useSettingsStore();

  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={toggleIsShidur}
      style={[baseStyles.listItem, isShidur && bottomBar.moreSelBtn]}
    >
      <IconWithText iconName="public" text={t('bottomBar.toggleShidur')} />
    </TouchableOpacity>
  );
};
