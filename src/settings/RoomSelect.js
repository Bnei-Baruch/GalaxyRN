import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TextDisplayWithButton from '../components/TextDisplayWithButton';
import { baseStyles } from '../constants';
import useRoomStore from '../zustand/fetchRooms';
import { useInitsStore } from '../zustand/inits';

const RoomSelect = () => {
  const [searchText, setSearchText] = useState();
  const [rooms, setRooms] = useState([]);
  const [open, setOpen] = useState(false);

  const { fetchRooms, setRoom, room } = useRoomStore();
  const { setReadyForJoin } = useInitsStore();
  const { t } = useTranslation();

  useEffect(() => {
    fetchRooms().then(rooms => setRooms(rooms));
  }, []);

  useEffect(() => {
    room && setSearchText(room.description);
  }, [room]);

  const filteredOptions = rooms?.filter(o =>
    o.description.toLowerCase().includes(searchText?.toLowerCase())
  );

  const handleSearch = text => {
    setSearchText(text);
    const _room = filteredOptions.find(
      o => o.description.toLowerCase() === text.toLowerCase()
    );
    _room ? setRoom(_room) : setRoom(null);
  };

  const handleSelect = value => {
    setRoom(value);
    Keyboard.dismiss();
    toggleOpen(false);
  };

  const toggleOpen = (_open = !open) => setOpen(_open);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'position' : 'height'}
      keyboardVerticalOffset={45}
    >
      <View style={styles.container}>
        <TextDisplayWithButton
          label={t('settings.selectRoom')}
          value={room?.description}
          button={
            <TouchableOpacity
              onPress={setReadyForJoin}
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
});

export default RoomSelect;
