import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../components/CustomText';
import { SettingsJoined } from '../settings/SettingsJoined';
import { topMenuBtns } from './helper';

export const SettingsBtn = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  const toggleVisible = () => setVisible(!visible);

  return (
    <>
      <TouchableOpacity onPress={toggleVisible} style={topMenuBtns.btn}>
        <Icon name="settings" size={30} color="white" />
        <Text style={topMenuBtns.menuItemText}>{t('topBar.settings')}</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        presentationStyle="pageSheet"
        style={styles.bg}
        visible={visible}
        onRequestClose={toggleVisible}
      >
        <SettingsJoined toggleVisible={toggleVisible} />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bg: {
    backgroundColor: 'black',
  },
});
