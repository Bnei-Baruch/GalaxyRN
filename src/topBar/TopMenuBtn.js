import * as React from 'react';
import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StudyMaterialsBtn } from './StudyMaterialsBtn';
import { DonateBtn } from './DonateBtn';
import { SupportBtn } from './SupportBtn';
import { SettingsBtn } from './SettingsBtn';
import LogoutBtn from './LogoutBtn';

export const TopMenuBtn = () => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => setOpen(!open);

  return (
    <View style={styles.menuContainer}>
      <TouchableOpacity onPress={toggleOpen}>
        <Icon name="menu" size={30} color="black" />
      </TouchableOpacity>
      <Modal
        visible={open}
        presentationStyle="fullScreen"
        transparent={false}
      >
        <View style={styles.modal} onPress={toggleOpen}>
          <View style={styles.modalContainer}>
            <StudyMaterialsBtn />
            <DonateBtn />
            <SupportBtn />
            <SettingsBtn />
            <LogoutBtn />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container     : {
    flexDirection : 'row',
    alignItems    : 'flex-start',
    justifyContent: 'space-between',
    padding       : 10,
  },
  modal         : {
    flex           : 1,
    justifyContent : 'center',
    alignItems     : 'center',
    flexDirection  : 'column',
    backgroundColor: 'grey'

  },
  modalContainer: {
    backgroundColor: 'white',
    padding        : 24,
  },
  menuItem      : {
    padding   : 10,
    fontSize  : 16,
    whiteSpace: 'nowrap',
  },
});