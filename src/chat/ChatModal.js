import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { modalModes } from '../zustand/helper';

import ScreenTitle from '../components/ScreenTitle';
import { useChatStore } from '../zustand/chat';
import { useCrispStore } from '../zustand/crisp';
import { ChatCounter } from './ChatCounter';
import { Questions } from './Questions';
import { RoomChat } from './RoomChat';

export const ChatModal = () => {
  const { mode, setChatMode, cleanCounters } = useChatStore();
  const { start: openSupport } = useCrispStore();
  const { t } = useTranslation();

  useEffect(() => {
    return () => {
      cleanCounters();
    };
  }, []);

  const closeModal = () => setChatMode(modalModes.close);

  return (
    <Modal
      visible={mode !== modalModes.close}
      onRequestClose={closeModal}
      animationType="none"
      presentationStyle="formSheet"
      statusBarTranslucent={true}
      supportedOrientations={['portrait', 'landscape']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
      >
        <ScreenTitle text={t('topBar.communicationTitle')} close={closeModal} />
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tabContainer,
              mode === modalModes.chat && styles.selectedTab,
            ]}
            onPress={() => setChatMode(modalModes.chat)}
          >
            <Text style={styles.tabText}>{t('chat.tab.chat')}</Text>
            <ChatCounter />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabContainer]} onPress={openSupport}>
            <Text style={styles.tabText}>{t('chat.tab.support')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabContainer,
              mode === modalModes.question && styles.selectedTab,
            ]}
            onPress={() => setChatMode(modalModes.question)}
          >
            <Text style={styles.tabText}>{t('chat.tab.question')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          {mode === modalModes.chat && <RoomChat />}
          {mode === modalModes.question && <Questions />}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    width: '100%',
  },
  tabContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTab: {
    borderBottomWidth: 5,
  },
  tabText: {
    color: 'white',
    fontSize: 16,
  },
  newMsgs: {
    color: 'red',
    fontSize: 16,
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});
