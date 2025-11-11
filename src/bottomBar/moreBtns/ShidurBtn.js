import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';

import { baseStyles } from '../../constants';
import IconWithText from '../../settings/IconWithText';
import { useSettingsStore } from '../../zustand/settings';
import { bottomBar } from '../helper';

export const ShidurBtn = () => {
  const { isShidur, toggleIsShidur } = useSettingsStore();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={toggleIsShidur}
      style={[baseStyles.listItem, isShidur && baseStyles.listItemSelected]}
    >
      <IconWithText iconName="desktop-windows" text={t('bottomBar.shidur')} />
    </TouchableOpacity>
  );
};
