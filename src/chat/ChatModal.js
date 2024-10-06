import { useChatStore, chatModes } from '../zustand/chat';
import { View, Modal, Text, StyleSheet, Button } from 'react-native';
import { RoomChat } from './RoomChat';
import ScreenTitle from '../components/ScreenTitle';

export const ChatModal = () => {
  const { mode, setChatMode } = useChatStore();

  const selectTab = (m) => setChatMode(m);

  return (
    <Modal visible={mode !== chatModes.close}>
      <ScreenTitle text={'Communication'} />
      <View style={styles.tabs}>
        <Button title={'Chat'} onPress={() => selectTab(chatModes.chat)} />
        <Button title={'SUPPORT'} onPress={() => selectTab(chatModes.support)} />
        <Button title={'QUESTION'} onPress={() => selectTab(chatModes.question)} />
      </View>
      <View>
        {mode === chatModes.chat && <RoomChat />}
        {mode === chatModes.support && <Text></Text>}
        {mode === chatModes.question && <Text></Text>}
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
    flexDirection : 'row',
    justifyContent: 'space-between'
  }
});
