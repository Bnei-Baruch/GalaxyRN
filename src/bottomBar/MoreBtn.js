import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { ChatCounter } from '../chat/ChatCounter';
import ButtonsPaneModal, { useButtonsPaneModal } from '../components/ButtonsPaneModal';
import { useUiActions } from '../zustand/uiActions';
import { bottomBar } from './helper';
import { ChatBtn } from './moreBtns/ChatBtn';
import { GroupsBtn } from './moreBtns/GroupsBtn';
import { HideSelfBtn } from './moreBtns/HideSelfBtn';
import { ShidurBtn } from './moreBtns/ShidurBtn';
import { VoteBtn } from './moreBtns/VoteBtn';

import BottomBarIconWithText from '../settings/BottomBarIconWithText';

export const MoreBtn = () => {
  const { toggleShowBars } = useUiActions();
  const modalContext = useButtonsPaneModal();

  const items = [
    { component: <GroupsBtn />, key: 1 },
    { component: <ShidurBtn />, key: 2 },
    { component: <HideSelfBtn />, key: 3 },
    { component: <VoteBtn />, key: 4 },
    { component: <ChatBtn />, key: 5 },
  ];

  const handlePress = () => toggleShowBars(false, true);

  const renderItem = item => item.component;

  const triggerContent = (
    <View style={bottomBar.moreSelBtn}>
      <BottomBarIconWithText
        iconName={modalContext ? "close" : "more-vert"}
        text='close'
        extraStyle={modalContext ? ['toggle_on_alt2b', 'toggle_on_icon_alt2']:['toggle_off', 'toggle_off_icon'] }
        showtext={false}
      />
      <ChatCounter />
    </View>
  );

  if (modalContext) {
    return (
      <TouchableOpacity onPress={modalContext.closeModal}>
        {triggerContent}
      </TouchableOpacity>
    );
  }

  return (
    <ButtonsPaneModal
      items={items}
      renderItem={renderItem}
      onOpen={handlePress}
      // styles={{ padding: 0, margin: 0 }}
      trigger={triggerContent}
    />
  );
};

