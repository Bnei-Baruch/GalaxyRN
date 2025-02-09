import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../../zustand/settings';
import IconWithText from '../../settings/IconWithText';
import { baseStyles } from '../../constants';
import { bottomBar } from '../helper';
import { useTranslation } from 'react-i18next';

export const GroupsBtn = () => {
  const { showGroups, toggleShowGroups } = useSettingsStore();
  const { t }                                = useTranslation();

  const handlePress = () => toggleShowGroups();

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[baseStyles.listItem, showGroups && bottomBar.moreSelBtn]}
    >
      <IconWithText iconName="public" text={t('bottomBar.quads')} />
    </TouchableOpacity>
  );
};
