import { StyleSheet, View, ScrollView } from 'react-native';
import { useChatStore } from '../zustand/chat';
import { Message } from './Message';
import { RoomChatForm } from './RoomChatForm';

export const RoomChat = () => {
  const { roomMsgs } = useChatStore();
  return (
    <View>
      <ScrollView>
        {roomMsgs.map(m => <Message key={m.time} msg={m} />)}
      </ScrollView>
      <RoomChatForm style={styles.form} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    padding        : 20
  },
  form     : {
    direction: 'rtl',
    textAlign: 'right',
  }
});
