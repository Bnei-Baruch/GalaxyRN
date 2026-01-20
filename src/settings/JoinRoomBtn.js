import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import Text from '../components/CustomText';
import { useRoomStore } from '../zustand/fetchRooms';
import { useInRoomStore } from '../zustand/inRoom';


const JoinRoomBtn = () => {
  const { room, setSelectRoomOpen } = useRoomStore();
  const { joinRoom } = useInRoomStore();
  const { t } = useTranslation();


  const handleJoin = () => {
    joinRoom();
    setSelectRoomOpen(false);
  };

  return (
    <TouchableOpacity
      onPress={handleJoin}
      disabled={!room}
      style={[styles.button, !room && styles.buttonDisabled]}
    >
      <Text style={styles.buttonText}>{t('settings.join')}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderTopEndRadius: 5,
    borderBottomEndRadius: 5,
    backgroundColor: '#03A9F4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#9e9e9e',
    height: 40,
  },
  buttonDisabled: {
    backgroundColor: '#9e9e9e',
  },
  buttonText: {
    color: 'white',
  },
});

export default JoinRoomBtn;
