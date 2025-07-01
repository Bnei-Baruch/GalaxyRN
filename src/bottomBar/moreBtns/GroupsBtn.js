import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';

import { baseStyles } from '../../constants';
import IconWithText from '../../settings/IconWithText';
import { useSettingsStore } from '../../zustand/settings';
import { bottomBar } from '../helper';

export const GroupsBtn = () => {
  const { showGroups, toggleShowGroups } = useSettingsStore();
  const { t } = useTranslation();

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
