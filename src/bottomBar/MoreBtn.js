import * as React from 'react';
import { Pressable } from 'react-native';

import { ChatCounter } from '../chat/ChatCounter';
import BottomBarIconWithText from '../settings/BottomBarIconWithTextAnimated';
import { useUiActions } from '../zustand/uiActions';
import { bottomBar } from './helper';
export const MoreBtn = () => {
  const { toggleMoreModal, moreModal, toggleShowBars } = useUiActions();

  const handlePress = () => {
    toggleShowBars(false, !moreModal);
    toggleMoreModal();
  };

  return (
    <Pressable onPress={handlePress} style={bottomBar.moreSelBtn}>
      <BottomBarIconWithText
        iconName={moreModal ? 'close' : 'more-vert'}
        text="close"
        extraStyle={
          moreModal
            ? ['toggle_on_alt2b', 'toggle_on_icon_alt2']
            : ['toggle_off', 'toggle_off_icon']
        }
        showtext={false}
      />
      <ChatCounter />
    </Pressable>
  );
};
