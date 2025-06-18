import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ChatCounter } from '../chat/ChatCounter';
import ListInModal from '../components/ListInModal';
import { useChatStore } from '../zustand/chat';
import { useUiActions } from '../zustand/uiActions';
import { bottomBar } from './helper';
import { ChatBtn } from './moreBtns/ChatBtn';
import { GroupsBtn } from './moreBtns/GroupsBtn';
import { HideSelfBtn } from './moreBtns/HideSelfBtn';
import { ShidurBtn } from './moreBtns/ShidurBtn';
import { VoteBtn } from './moreBtns/VoteBtn';

export const MoreBtn = () => {
  const { toggleShowBars } = useUiActions();
  const { setChatMode } = useChatStore();

  const items = [
    { component: <GroupsBtn />, key: 1 },
    { component: <ShidurBtn />, key: 2 },
    { component: <HideSelfBtn />, key: 3 },
    { component: <VoteBtn />, key: 4 },
    { component: <ChatBtn />, key: 5 },
  ];

  const handlePress = () => toggleShowBars(false, true);

  const renderItem = item => item.component;

  return (
    <ListInModal
      items={items}
      renderItem={renderItem}
      onOpen={handlePress}
      styles={{ padding: 0, margin: 0 }}
      trigger={
        <View style={[styles.btn, bottomBar.btnMore]}>
          <Icon name="more-vert" size={40} color="white" />
          <ChatCounter />
        </View>
      }
    />
  );
};

export const styles = StyleSheet.create({
  btn: {
    display: 'flex',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    height: 75,
    marginHorizontal: 2,
  },
});
