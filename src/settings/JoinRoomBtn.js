import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import Text from '../components/CustomText';
import { useRoomStore } from '../zustand/fetchRooms';
import { useInRoomStore } from '../zustand/inRoom';
import { useSettingsStore } from '../zustand/settings';


// `standalone`: rendered on its own (broadcast-only, no ten picker beside it).
const JoinRoomBtn = ({ standalone = false }) => {
  const { room, setSelectRoomOpen } = useRoomStore();
  const { safeJoinRoom } = useInRoomStore();
  const isTen = useSettingsStore(state => state.isTen);
  const { t } = useTranslation();
  // Broadcast-only needs no ten to join.
  const disabled = isTen && !room;


  const handleJoin = () => {
    // Joining from the room search modal: close the keyboard before the
    // modal goes away, otherwise it stays open over the room
    Keyboard.dismiss();
    safeJoinRoom();
    setSelectRoomOpen(false);
  };

  return (
    <TouchableOpacity
      testID="joinRoomBtn"
      accessibilityLabel="joinRoomBtn"
      onPress={handleJoin}
      disabled={disabled}
      style={[
        styles.button,
        standalone && styles.buttonStandalone,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text
        style={[styles.buttonText, standalone && styles.buttonTextStandalone]}
      >
        {t(isTen ? 'settings.joinTen' : 'settings.joinBroadcast')}
      </Text>
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
  buttonStandalone: {
    borderRadius: 24,
    borderTopEndRadius: 24,
    borderBottomEndRadius: 24,
    borderWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    height: 48,
    marginTop: 8,
    marginBottom: 5,
  },
  buttonTextStandalone: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9e9e9e',
  },
  buttonText: {
    color: 'white',
  },
});

export default JoinRoomBtn;
