import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, Keyboard, } from 'react-native';
import useRoomStore from '../zustand/fetchRooms';
import { useSettingsStore } from '../zustand/settings';
import { baseStyles } from '../constants';
import { useTranslation } from 'react-i18next';
import { useInitsStore } from '../zustand/inits';

const RoomSelect = () => {
  const [searchText, setSearchText] = useState();
  const [rooms, setRooms]           = useState([]);
  const [open, setOpen]             = useState(false);

  const { fetchRooms, setRoom, room } = useRoomStore();
  const { setReadyForJoin }           = useInitsStore();
  const { t }                         = useTranslation();

  useEffect(() => {
    fetchRooms().then(rooms => setRooms(rooms));
  }, []);

  useEffect(() => {
    room && setSearchText(room.description);
  }, [room]);

  const filteredOptions = rooms?.filter(o => o.description.toLowerCase().includes(searchText?.toLowerCase()));

  const handleSearch   = (text) => {
    setSearchText(text);
    const _room = filteredOptions.find(o => o.description.toLowerCase() === text.toLowerCase());
    _room ? setRoom(room) : setRoom(null);
  };
  const handleSelect   = (value) => {
    setRoom(value);
    Keyboard.dismiss();
    toggleOpen(false);
  };
  const handleJoinRoom = () => setReadyForJoin();
  const toggleOpen     = (_open = !open) => setOpen(_open);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, baseStyles.text]}>{t('settings.selectRoom')}</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, baseStyles.text]}
          placeholder={t('settings.search')}
          value={searchText}
          onChangeText={handleSearch}
          onFocus={() => toggleOpen(true)}
        />

        <Button title={t('settings.join')} onPress={handleJoinRoom} disabled={!room} styles={{
          flex  : 1,
          height: '100%'
        }} />
      </View>
      {
        open && filteredOptions.length > 0 && (filteredOptions.length > 1 || !room) && (

          <FlatList
            keyboardShouldPersistTaps={'handled'}
            style={styles.list}
            data={filteredOptions}
            keyExtractor={(item) => item.room}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelect(item)}>
                <Text style={[styles.itemText, baseStyles.text]}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )
      }
    </View>
  );
};

const styles = StyleSheet.create({
  label          : {
    fontSize    : 16,
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection    : 'row',
    alignItems       : 'center',
    justifyContent   : 'space-between',
    paddingHorizontal: 10,
  },
  searchInput    : {
    flex             : 1,
    paddingHorizontal: 10,
    borderWidth      : 1,
    borderColor      : 'rgba(255, 255, 255, 0.23)',
    borderRadius     : 5,
    marginRight      : 10,
  },
  list           : {
    borderWidth    : 1,
    borderColor    : '#ccc',
    borderRadius   : 5,
    bottom         : 60,
    position       : 'absolute',
    width          : '100%',
    backgroundColor: 'black',
    maxHeight      : 200,
  },
  itemText       : {
    padding: 10,
  },
});

export default RoomSelect;