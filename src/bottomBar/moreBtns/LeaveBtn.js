import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import IconWithText from '../../settings/IconWithText';
import { baseStyles } from '../../constants';
import { useTranslation } from 'react-i18next';
import { useInitsStore } from '../../zustand/inits';

export const LeaveBtn = () => {
  const { setReadyForJoin } = useInitsStore();
  const { t }               = useTranslation();

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
