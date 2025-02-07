import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../../zustand/settings';
import IconWithText from '../../settings/IconWithText';
import { baseStyles } from '../../constants';

export const LeaveBtn = () => {
  const { setReadyForJoin } = useSettingsStore();

  const handlePress = () => setReadyForJoin(false);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={baseStyles.listItem}
    >
      <IconWithText iconName="arrow-forward" text={t('bottomBar.leave')} />
    </TouchableOpacity>
  );
};
