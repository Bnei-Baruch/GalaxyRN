import { StyleSheet, View, ScrollView } from 'react-native';
import { useChatStore } from '../zustand/chat';
import { RoomChatForm } from './RoomChatForm';
import { Message } from './Message';
import { useTranslation } from 'react-i18next';

export const RoomChat = () => {
  const { roomMsgs } = useChatStore();
  const { t }        = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView>
        <View size="mini" color="grey">
          {t('virtualChat.msgRoomInfo')}
        </View>
        {roomMsgs.map(m => <Message key={m.id} msg={m} />)}
      </ScrollView>

      <RoomChatForm style={styles.form} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    padding        : 24,
    backgroundColor: '#eaeaea',
    flexDirection  : 'column',
  },
  form     : {
    direction: 'rtl',
    textAlign: 'right',
  }
});
