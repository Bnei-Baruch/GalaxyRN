import * as React from 'react';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ListInModal from '../components/ListInModal';
import VersionInfo from '../components/VersionInfo';
import { useUiActions } from '../zustand/uiActions';
import LogoutBtn from './LogoutBtn';
import SendLogsBtn from './SendLogsBtn';
import { SettingsBtn } from './SettingsBtn';

export const TopMenuBtn = () => {
  const { toggleShowBars } = useUiActions();

  const items = [
    { component: <SettingsBtn />, key: 1 },
    { component: <LogoutBtn />, key: 2 },
    { component: <VersionInfo />, key: 3 },
    { component: <SendLogsBtn />, key: 4 },
  ];

  const renderItem = item => item.component;

  const handlePress = () => toggleShowBars(false, true);

  return (
    <ListInModal
      onOpen={handlePress}
      items={items}
      renderItem={renderItem}
      trigger={<Icon name="menu" size={30} color="white" style={styles.btn} />}
    />
  );
};

const styles = StyleSheet.create({
  btn: {
    marginRight: 10,
  },
});
