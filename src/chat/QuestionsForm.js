import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/CustomText';
import TextInput from '../components/CustomTextInput';
import { useChatStore } from '../zustand/chat';
import { useRoomStore } from '../zustand/fetchRooms';
import { useUserStore } from '../zustand/user';

export const QuestionsForm = () => {
  const [value, setValue] = useState('');
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { room } = useRoomStore();
  const {
    user: { id, display },
  } = useUserStore();
  const { sendQuestion } = useChatStore();

  if (!room?.room) return null;

  const newChatMessage = async () => {
    await sendQuestion({
      serialUserId: id,
      question: { content: value },
      user: {
        id,
        name: display,
        galaxyRoom: room.description,
        gender: !room.description.match(/^W\s/) ? 'male' : 'female',
      },
    });
    setValue('');
  };

  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 10) + 10 }}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={t('chat.myName')}
          value={display}
          style={styles.input}
          editable={false}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={t('chat.room')}
          value={room.description}
          style={styles.input}
          editable={false}
        />
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={t('chat.newMsg')}
          placeholderTextColor="rgba(255, 255, 255, 0.7)"
          value={value}
          onChangeText={setValue}
          style={styles.input}
          onSubmitEditing={newChatMessage}
          returnKeyType="send"
        />
      </View>
      <TouchableOpacity
        onPress={newChatMessage}
        style={[styles.button, !value.trim() && styles.buttonDisabled]}
        disabled={!value.trim()}
      >
        <Text style={styles.buttonText}>{t('chat.send')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    padding: 10,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'grey',
    padding: 10,
    height: 44,
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0,
    backgroundColor: 'blue',
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    margin: 10,
  },
  buttonDisabled: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
