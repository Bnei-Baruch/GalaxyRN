import * as React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ListInModal from '../components/ListInModal';
import { GroupsBtn } from './GroupsBtn';
import { bottomBar } from './helper';
import { View, StyleSheet } from 'react-native';
import { LeaveBtn } from './LeaveBtn';
import { useInRoomStore } from '../zustand/inRoom';

export const MoreBtn = () => {
  const { setShowBars } = useInRoomStore();

  const items = [
    { component: <GroupsBtn />, key: 1 },
    /*
    { component: 'broadcast', key: 2 },
    { component: 'hideSelf', key: 3 },
    { component: 'vote', key: 4 },
    */
    { component: <LeaveBtn />, key: 5 },
  ];

  const handlePress = () => setShowBars(false);

  const renderItem = (item) => item.component;

  return (
    <ListInModal
      items={items}
      renderItem={renderItem}
      onOpen={handlePress}
      trigger={
        <View style={[styles.btn, bottomBar.btnMore]}>
          <Icon name="more-vert" size={40} color="white" />
        </View>
      }
    />
  );
};

export const styles = StyleSheet.create({
  btn: {
    display         : 'flex',
    textAlign       : 'center',
    alignItems      : 'center',
    justifyContent  : 'center',
    height          : 75,
    marginHorizontal: 2,
  },
});