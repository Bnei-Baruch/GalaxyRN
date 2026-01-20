import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  View
} from 'react-native';
import Text from '../components/CustomText';
import TextDisplayWithButton from '../components/TextDisplayWithButton';
import { baseStyles } from '../constants';
import { useRoomStore } from '../zustand/fetchRooms';
import JoinRoomBtn from './JoinRoomBtn';
import RoomSelectModal from './RoomSelectModal';

const NAMESPACE = 'RoomSelect';

const RoomSelect = () => {
  const { setSelectRoomOpen } = useRoomStore();

  const { room } = useRoomStore();
  const { t } = useTranslation();

  const toggleOpen = () => setSelectRoomOpen(true);

  return (
    <View style={[styles.container, baseStyles.viewBackground]}>
      <TextDisplayWithButton label={t('settings.selectRoom')}>
        <View style={styles.triggerContainer}>
          <Pressable style={styles.textContainer} onPress={toggleOpen}>
            <Text style={styles.text}>
              {room ? room.description : t('settings.selectRoom')}
            </Text>
          </Pressable>
          <JoinRoomBtn />
        </View>
      </TextDisplayWithButton>
      <RoomSelectModal />
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
  },
  triggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  textContainer: {
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
    paddingHorizontal: 10,
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
});

export default RoomSelect;
