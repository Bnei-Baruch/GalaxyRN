import { StyleSheet, View, ScrollView } from 'react-native';
import { useChatStore } from '../zustand/chat';
import { Message } from './Message';
import { RoomChatForm } from './RoomChatForm';
import { baseStyles } from '../constants';

export const RoomChat = () => {
  const { roomMsgs } = useChatStore();
  return (
    <View style={[styles.container]}>
      <View style={styles.messagesContainer}>
        <ScrollView style={styles.scroll}>
          {roomMsgs.map(m => <Message key={m.time} msg={m} />)}
        </ScrollView>
      </View>
      <View style={styles.formContainer}>
        <RoomChatForm />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  scroll: {
    width: '100%',
  },
  formContainer: {
    marginTop: 10,
  }
});
