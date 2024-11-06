import * as React from 'react';
import { useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ListInModal from '../components/ListInModal';
import { GroupsBtn } from './GroupsBtn';
import { bottomBar } from './helper';
import { View } from 'react-native';
import { LeaveBtn } from './LeaveBtn';

export const MoreBtn = () => {
  const { open, setOpen } = useState();

  const items = [
    { component: <GroupsBtn />, key: 1 },
    /*
    { component: 'broadcast', key: 2 },
    { component: 'hideSelf', key: 3 },
    { component: 'vote', key: 4 },
    */
    { component: <LeaveBtn />, key: 5 },
  ];

  const handlePress = () => setOpen(!open);

  const renderItem = (item) => item.component;

  return (
    <ListInModal
      items={items}
      renderItem={renderItem}
      trigger={
        <View style={[bottomBar.btn, bottomBar.btnMore]}>
          <Icon name="more-vert" size={40} color="grey" />
        </View>
      }
    />
  );
};
