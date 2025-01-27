import { StyleSheet, View, ScrollView } from 'react-native';
import { useChatStore } from '../zustand/chat';
import { Message } from './Message';
import { RoomChatForm } from './RoomChatForm';
import { baseStyles } from '../constants';

export const RoomChat = () => {
  const { roomMsgs } = useChatStore();
  return (
    <View>
      <View style={baseStyles.full}>
        <ScrollView>
          {roomMsgs.map(m => <Message key={m.time} msg={m} />)}
        </ScrollView>
      </View>
      <RoomChatForm />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    padding        : 20
  }
});
