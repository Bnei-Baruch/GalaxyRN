import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/CustomText';
import TextInput from '../components/CustomTextInput';
import mqtt from '../libs/mqtt';
import { useRoomStore } from '../zustand/fetchRooms';
import { useUserStore } from '../zustand/user';

export const RoomChatForm = () => {
  const [value, setValue] = useState('');
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { room } = useRoomStore();
  const { user } = useUserStore();

  if (!room?.room) return null;

  // This function will send the message without dismissing the keyboard
  const forceSubmit = () => {
    if (!value.trim()) return;

    const { id, display, role } = user;

    const msg = {
      user: { id, role, display },
      type: 'client-chat',
      text: value,
    };

    mqtt.send(JSON.stringify(msg), false, `galaxy/room/${room?.room}/chat`);
    setValue('');
  };

  return (
    <View
      style={[
        styles.inputContainer,
        { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0 },
      ]}
    >
      <TextInput
        style={styles.input}
        placeholder={t('chat.newMsg')}
        placeholderTextColor="rgba(255, 255, 255, 0.7)"
        value={value}
        onChangeText={setValue}
        onSubmitEditing={forceSubmit}
        returnKeyType="send"
      />
      <TouchableOpacity
        style={[styles.button, !value.trim() && styles.buttonDisabled]}
        onPress={forceSubmit}
        disabled={!value.trim()}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>{t('chat.send')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'grey',
    padding: 10,
    height: 44,
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginRight: 10,
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
  },
  buttonDisabled: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  containerRtl: {
    direction: 'rtl',
    textAlign: 'right',
  },
  containerLtr: {
    direction: 'ltr',
    textAlign: 'left',
  },
  time: {
    color: 'grey',
  },
});
