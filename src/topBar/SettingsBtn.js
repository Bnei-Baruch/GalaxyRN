import * as React from 'react';
import { useState } from 'react';
import { TouchableOpacity, Text, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from './helper';
import { SettingsJoined } from '../settings/SettingsJoined';
import { baseStyles } from '../constants';

export const SettingsBtn = () => {
  const [visible, setVisible] = useState(false);
  const toggleVisible         = () => setVisible(!visible);

  return (
    <>
      <TouchableOpacity onPress={toggleVisible} style={topMenuBtns.btn}>
        <Icon name="settings" size={30} color="black" />
        <Text style={baseStyles.text}>{'oldClient.settings'}</Text>
      </TouchableOpacity>
      <Modal
        style={styles.bg}
        visible={visible}
        onRequestClose={toggleVisible}
        animationType="none"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
      >
        <SettingsJoined toggleVisible={toggleVisible} />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bg: {
    backgroundColor: 'black',
  }
});