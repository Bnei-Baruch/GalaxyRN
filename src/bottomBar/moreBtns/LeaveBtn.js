import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useInRoomStore } from '../../zustand/inRoom';
import { bottomBar } from '../helper';

export const LeaveBtn = () => {
  const { exitRoom } = useInRoomStore();
  const { t } = useTranslation();
  const handlePress = () => exitRoom();

  return (
    <Pressable onPress={handlePress} style={bottomBar.btn}>
      <BottomBarIconWithText
        iconName="logout"
        text={t('bottomBar.leave')}
        extraStyle={['rest_alt', 'rest_alt_icon']}
        showtext={true}
        direction={['horizontal', 'horizontal']}
      />
    </Pressable>
  );
};
