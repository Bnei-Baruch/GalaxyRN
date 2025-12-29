import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useSettingsStore } from '../../zustand/settings';
import { bottomBar } from '../../roomMenuLevel0/helper';
export const GroupsBtn = () => {
  const { showGroups, toggleShowGroups } = useSettingsStore();
  const { t } = useTranslation();
  return (
    <Pressable onPress={toggleShowGroups} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName="public"
        text={t('bottomBar.kliOlami')}
        extraStyle={
          !showGroups
            ? ['toggle_off', 'toggle_off_icon']
            : ['toggle_on_alt2', 'toggle_on_icon_alt2']
        }
        showtext={true}
        direction={['vertical', 'horizontal']}
      />
    </Pressable>
  );
};
