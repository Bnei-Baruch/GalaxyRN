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
  const { lastMsg } = useSubtitleStore();

  if (!lastMsg) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={toggleIsShidur}
      style={[baseStyles.listItem, isShidur && bottomBar.moreSelBtn]}
    >
      <IconWithText iconName="public" text={t('bottomBar.shidur')} />
    </TouchableOpacity>
  );
};
