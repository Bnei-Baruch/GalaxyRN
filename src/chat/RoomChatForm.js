import { StyleSheet, Button, View, TextInput } from 'react-native';
import { useState } from 'react';
import useRoomStore from '../zustand/fetchRooms';
import { useUserStore } from '../zustand/user';
import mqtt from '../shared/mqtt';
import { useTranslation } from 'react-i18next';

export const RoomChatForm = () => {
  const [value, setValue] = useState('');
  const { t }             = useTranslation();

  const { room } = useRoomStore();
  const { user } = useUserStore();

  const newChatMessage = () => {
    const { id, display, role } = user;

    const msg   = { user: { id, role, display }, type: 'client-chat', text: value };
    const topic = id ? `galaxy/users/${id}` : `galaxy/room/${room}/chat`;

    mqtt.send(JSON.stringify(msg), false, topic);
  };

  return (
    <View style={styles.container}>
      <TextInput
        type="text"
        placeholder={t('chat.newMsg')}
        value={value}
        onChangeText={setValue}
      >
      </TextInput>
      <Button size={30} positive onPress={newChatMessage} title={t('chat.send')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container   : {
    borderRadius  : 4,
    borderWidth   : 1,
    borderColor   : 'grey',
    flexDirection : 'row',
    justifyContent: 'space-between'
  },
  containerRtl: {
    direction: 'rtl',
    textAlign: 'right',
  },
  containerLtr: {
    direction: 'ltr',
    textAlign: 'left',
  },
  time        : {
    color: 'grey'
  }
});
