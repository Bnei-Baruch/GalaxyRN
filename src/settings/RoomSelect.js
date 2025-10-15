import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../components/CustomText';
import TextInput from '../components/CustomTextInput';
import TextDisplayWithButton from '../components/TextDisplayWithButton';
import { baseStyles } from '../constants';
import logger from '../services/logger';
import useRoomStore from '../zustand/fetchRooms';
import { useInRoomStore } from '../zustand/inRoom';
import { useInitsStore } from '../zustand/inits';

const NAMESPACE = 'RoomSelect';

const RoomSelect = () => {
  const [searchText, setSearchText] = useState();
  const [rooms, setRooms] = useState([]);
  const [open, setOpen] = useState(false);

  const { fetchRooms, setRoom, room } = useRoomStore();
  const { joinRoom } = useInRoomStore();
  const { mqttIsOn, abortMqtt, initMQTT } = useInitsStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchRooms().then(rooms => setRooms(rooms));
  }, []);

  useEffect(() => {
    room && setSearchText(room.description);
  }, [room]);

  const filteredOptions = rooms?.filter(o => {
    const _sText = searchText?.toLowerCase().trim();
    if (!_sText) return true;
    return o.description.toLowerCase().includes(_sText);
  });

  logger.debug(NAMESPACE, 'rooms rendered', filteredOptions[0]);

  const handleSearch = text => {
    const searchValue = text.toLowerCase().trim();
    setSearchText(text);
    const _room = filteredOptions.find(
      o => o.description.toLowerCase() === searchValue
    );
    _room ? setRoom(_room) : setRoom(null);
  };

  const handleSelect = value => {
    setRoom(value);
    Keyboard.dismiss();
    toggleOpen(false);
  };

  const toggleOpen = (_open = !open) => setOpen(_open);

  if (mqttIsOn === false) {
    const handleRestartMqtt = async () => {
      await abortMqtt();
      await initMQTT();
    };

    return (
      <View style={[styles.container, styles.noConnectionContainer]}>
        <View style={styles.iconContainer}>
          <Icon name="warning" size={48} color="#ff6b6b" />
        </View>
        <Text style={styles.text}>{t('connection.noConnection')}</Text>
        <TouchableOpacity style={styles.button} onPress={handleRestartMqtt}>
          <Text style={styles.buttonText}>{t('settings.tryConnect')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleJoin = () => {
    joinRoom();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'position' : 'padding'}
      keyboardVerticalOffset={45}
    >
      <View style={styles.container}>
        <TextDisplayWithButton
          label={t('settings.selectRoom')}
          value={room?.description}
          button={
            <TouchableOpacity
              onPress={handleJoin}
              disabled={!room}
              style={[styles.button, !room && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>{t('settings.join')}</Text>
            </TouchableOpacity>
          }
          input={
            <TextInput
              style={[styles.searchInput, baseStyles.text]}
              placeholder={t('settings.search')}
              value={searchText}
              onChangeText={handleSearch}
              onFocus={() => toggleOpen(true)}
              onBlur={() => toggleOpen(false)}
              autoCorrect={false}
              autoComplete="off"
            />
          }
        />

        {open &&
          filteredOptions.length > 0 &&
          (filteredOptions.length > 1 || !room) && (
            <FlatList
              keyboardShouldPersistTaps={'handled'}
              style={styles.list}
              data={filteredOptions}
              keyExtractor={item => item.room}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelect(item)}>
                  <Text style={[styles.itemText, baseStyles.text]}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    paddingTop: 10,
  },
  noConnectionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 20,
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
    bottom: 70,
    position: 'absolute',
    width: '100%',
    backgroundColor: 'black',
    maxHeight: 200,
  },
  itemText: {
    padding: 10,
  },
  button: {
    borderTopEndRadius: 5,
    borderBottomEndRadius: 5,
    backgroundColor: '#03A9F4',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#9e9e9e',
  },
  buttonDisabled: {
    backgroundColor: '#9e9e9e',
  },
  buttonText: {
    color: 'white',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
});

export default RoomSelect;
