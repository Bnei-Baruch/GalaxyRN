import * as React from 'react';
import { StyleSheet, View } from 'react-native';


import { ChatCounter } from '../chat/ChatCounter';
import ListInModal from '../components/ListInModal';
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
        <View style={bottomBar.moreSelBtn}>
          <BottomBarIconWithText iconName='more-vert' extraStyle={['rest','resticon']}/>
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
