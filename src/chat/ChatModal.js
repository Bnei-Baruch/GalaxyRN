import { useChatStore, chatModes } from '../zustand/chat';
import { View, Modal, Text, StyleSheet } from 'react-native';

export const ChatModal = () => {
  const { mode, setChatMode } = useChatStore();

  const selectTab = (m) => setChatMode(m);

  return (
    <Modal visible={mode !== chatModes.close}>
      <View style={styles.container}>
        <Text onPress={() => selectTab(chatModes.chat)}>Chat</Text>
        <Text onPress={() => selectTab(chatModes.support)}>Support</Text>
        <Text onPress={() => selectTab(chatModes.question)}>Question</Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex         : 1,
    flexDirection: 'row'
  },
});
