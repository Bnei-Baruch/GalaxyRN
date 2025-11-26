import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import { bottomBar } from '../helper';
import { useUserStore } from '../../zustand/user';

export const VoteBtn = () => {
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();
  const { user } = useUserStore();

  const toggleOpen = () => setOpen(!open);

  return (
    <>
      <Pressable onPress={toggleOpen} style={bottomBar.btn}>
        <BottomBarIconWithText
          iconName="thumbs-up-down"
          text={t('bottomBar.vote')}
          extraStyle={['rest', 'resticon']}
          showtext={true}
          direction="horizontal"
        />
      </Pressable>
      {open && (
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          transparent={true}
          visible={open}
          onRequestClose={toggleOpen}
        >
          <View style={styles.modal}>
            <View style={styles.conteiner}>
              <TouchableOpacity style={styles.close} onPress={toggleOpen}>
                <Icon name="close" size={20} color="white" />
              </TouchableOpacity>
              <WebView
                style={styles.item}
                source={{
                  uri: `https://vote.kli.one/button.html?answerId=1&userId=${user?.id}`,
                }}
              />
              <WebView
                style={styles.item}
                source={{
                  uri: `https://vote.kli.one/button.html?answerId=2&userId=${user?.id}`,
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};
const styles = StyleSheet.create({
  modal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  conteiner: {
    width: 200,
    height: 100,
    flexDirection: 'row',
  },
  item: {
    width: 100,
    height: 100,
  },
  close: {
    position: 'absolute',
    top: -25,
    right: -25,
    zIndex: 1,
  },
});
