import React, { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import useRoomStore from '../zustand/fetchRooms';
import { useSettingsStore } from '../zustand/settings';

const RoomSelect = () => {
  const [searchText, setSearchText]   = useState();
  const [rooms, setRooms]             = useState([]);
  const { fetchRooms, setRoom, room } = useRoomStore();
  const { setReadyForJoin }           = useSettingsStore();

  useEffect(() => {
    fetchRooms().then(rooms => setRooms(rooms));
  }, []);

  useEffect(() => {
    room && setSearchText(room.description);
  }, [room]);

  const filteredOptions = rooms?.filter(o => o.description.includes(searchText));

  const handleSearch   = (text) => setSearchText(text);
  const handleSelect   = (value) => setRoom(value);
  const handleJoinRoom = () => setReadyForJoin();

  return (
    <View>
      <Text style={styles.label}>{'select ten'}</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchText}
          onChangeText={handleSearch}
        />

        <Button title={'join room'} onPress={handleJoinRoom} disabled={!room} />
      </View>
      <View style={styles.container}>
        <FlatList
          data={filteredOptions}
          keyExtractor={(item) => item.room}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)}>
              <Text style={styles.itemText}>{item.description}</Text>
            </TouchableOpacity>
          )}
          style={styles.list}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container      : {
    marginBottom: 15,
  },
  label          : {
    fontSize    : 16,
    marginBottom: 5,
  },
  searchContainer: {
    borderWidth      : 1,
    borderColor      : '#ccc',
    borderRadius     : 5,
    paddingHorizontal: 10,
    marginBottom     : 10,

    flexDirection : 'row',
    alignItems    : 'flex-start',
    justifyContent: 'space-between',
    padding       : 10,
  },
  searchInput    : {
    height: 40,
  },
  list           : {
    borderWidth : 1,
    borderColor : '#ccc',
    borderRadius: 5,
  },
  itemText       : {
    padding: 10,
  },
});

export default RoomSelect;