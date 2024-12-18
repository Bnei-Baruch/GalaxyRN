import { useEffect } from 'react';
import { useChatStore } from '../zustand/chat';
import { modalModes } from '../zustand/helper';
import { View, Modal, Text, StyleSheet, Button } from 'react-native';

import { RoomChat } from './RoomChat';
import ScreenTitle from '../components/ScreenTitle';
import { useTranslation } from 'react-i18next';

export const ChatModal = () => {
  const { mode, setChatMode, cleanChat } = useChatStore();
  const { t }                            = useTranslation();

  useEffect(() => {
    return () => {
      cleanChat();
    };
  }, []);

  const selectTab  = (m) => setChatMode(m);
  const closeModal = () => setChatMode(modalModes.close);

  return (
    <Modal visible={mode !== modalModes.close}>
      <ScreenTitle text={t('topBar.communicationTitle')} close={closeModal} />
      <View style={styles.tabs}>
        <Button
          title={t('chat.tab.chat')}
          onPress={() => selectTab(modalModes.chat)}
        />
        <Button
          title={t('chat.tab.support')}
          onPress={() => selectTab(modalModes.support)}
        />
        <Button
          title={t('chat.tab.question')}
          onPress={() => selectTab(modalModes.question)}
        />
      </View>
      <View>
        {mode === modalModes.chat && <RoomChat />}
        {mode === modalModes.support && <Text></Text>}
        {mode === modalModes.question && <Text></Text>}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex         : 1,
    flexDirection: 'row'
  },
  tabs     : {
    flexDirection  : 'row',
    justifyContent : 'space-around',
    backgroundColor: 'grey'
  }
});
