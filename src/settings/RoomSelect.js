import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Text from '../components/CustomText';
import TextDisplayWithButton from '../components/TextDisplayWithButton';
import { baseStyles } from '../constants';
import logger from '../services/logger';
import { useRoomStore } from '../zustand/fetchRooms';
import { useInRoomStore } from '../zustand/inRoom';
import RoomSelectModal from './RoomSelectModal';

const NAMESPACE = 'RoomSelect';

const RoomSelect = () => {
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const { fetchRooms } = useRoomStore();

  const { room } = useRoomStore();
  const { joinRoom } = useInRoomStore();
  const { t } = useTranslation();

  logger.debug(NAMESPACE, 'rendered open', open, 'rooms', rooms.length);

  useEffect(() => {
    logger.debug(NAMESPACE, 'useEffect fetchRooms');
    fetchRooms().then(rooms => setRooms(rooms));
  }, []);

  const toggleOpen = () => setOpen(!open);

  const handleJoin = () => joinRoom();

  return (
    <View style={[styles.container, baseStyles.viewBackground]}>
      <TextDisplayWithButton label={t('settings.selectRoom')}>
        <View style={styles.triggerContainer}>
          <View style={styles.triggerTextContainer} onPress={toggleOpen}>
            <Text style={styles.triggerText} onPress={toggleOpen}>{room ? room.description : t('settings.selectRoom')}</Text>

          </View>

          <TouchableOpacity
            onPress={handleJoin}
            disabled={!room}
            style={[styles.button, !room && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>{t('settings.join')}</Text>
          </TouchableOpacity>
        </View>
      </TextDisplayWithButton>
      <RoomSelectModal open={open} toggleOpen={toggleOpen} rooms={rooms} />
    </View >
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    zIndex: 2,
  },
  container: {
    paddingTop: 10,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    border: 'none',
    color: 'white',
    paddingVertical: 0,
    marginVertical: 0,
  },
  list: {
    borderWidth: 1,
    borderColor: '#9e9e9e',
    borderRadius: 5,
    backgroundColor: '#222',
  },
  itemText: {
    padding: 10,
  },
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
  triggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  triggerTextContainer: {
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
    paddingHorizontal: 10,
  },
  triggerText: {
    fontSize: 16,
    color: 'white',
  },
});

export default RoomSelect;
