import { StyleSheet, Button, View, TextInput } from 'react-native';
import { useState } from 'react';
import useRoomStore from '../zustand/fetchRooms';
import { useUserStore } from '../zustand/user';
import mqtt from '../shared/mqtt';

export const RoomChatForm = () => {
  const [value, setValue] = useState('');

  const { room } = useRoomStore();
  const { user } = useUserStore();

  const newChatMessage = () => {
    const { id, display } = user;
    /* const role            = getUserRole();
     if (!role.match(/^(user|guest)$/) || value === '') {
       return;
     }*/
    const role  = 'user';
    const msg   = { user: { id, role, display }, type: 'client-chat', text: value };
    const topic = id ? `galaxy/users/${id}` : `galaxy/room/${room}/chat`;

    mqtt.send(JSON.stringify(msg), false, topic);
  };

  return (
    <View style={styles.container}>
      <TextInput
        type="text"
        placeholder={'virtualChat.enterMessage'}
        value={value}
        onChangeText={setValue}
      >
      </TextInput>
      <Button size={30} positive onPress={newChatMessage} title={'virtualChat.send'} />
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
