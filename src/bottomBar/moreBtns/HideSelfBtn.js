import * as React from 'react';
import { TouchableOpacity } from 'react-native';
import { useSettingsStore } from '../../zustand/settings';
import IconWithText from '../../settings/IconWithText';
import { bottomBar } from '../helper';
import { baseStyles } from '../../constants';

export const HideSelfBtn = () => {
  const { hideSelf, toggleHideSelf } = useSettingsStore();

  return (
    <TouchableOpacity
      onPress={toggleHideSelf}
      style={[baseStyles.listItem, hideSelf && bottomBar.moreSelBtn]}
    >
      <IconWithText iconName="person-off" text="Groups" />
    </TouchableOpacity>
  );
};
