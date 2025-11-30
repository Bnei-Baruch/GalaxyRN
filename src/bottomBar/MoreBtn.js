import * as React from 'react';
import { Pressable, View } from 'react-native';

import { ChatCounter } from '../chat/ChatCounter';
import { useUiActions } from '../zustand/uiActions';
import { bottomBar } from './helper';

import BottomBarIconWithText from '../settings/BottomBarIconWithTextAnimated';

export const MoreBtn = () => {
  const { toggleMoreModal, moreModal } = useUiActions();

  return (
    <Pressable onPress={toggleMoreModal} style={bottomBar.btn}>
      <View style={bottomBar.moreSelBtn}>
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
      </View>
    </Pressable>
  );
};
