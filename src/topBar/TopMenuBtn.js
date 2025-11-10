import * as React from 'react';
import { StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ListInModal from '../components/ListInModal';
import VersionInfo from '../components/VersionInfo';
import { useUiActions } from '../zustand/uiActions';
import { DonateBtn } from './DonateBtn';
import LogoutBtn from './LogoutBtn';
import { SettingsBtn } from './SettingsBtn';
import { StudyMaterialsBtn } from './StudyMaterialsBtn';

export const TopMenuBtn = () => {
  const { toggleShowBars } = useUiActions();

  const items = [
    { component: <StudyMaterialsBtn />, key: 1 },
    { component: <DonateBtn />, key: 2 },
    { component: <SettingsBtn />, key: 3 },
    { component: <LogoutBtn />, key: 4 },
    { component: <VersionInfo />, key: 5 },
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
