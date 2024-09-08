import React, { useEffect, useState } from 'react'
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import useRoomStore from '../zustand/fetchRooms'
import useAuthHttpParams from '../hooks/useAuthHttpParams'
import { useSettingsStore } from '../zustand/settings'

const RoomSelect = () => {
  const [searchText, setSearchText] = useState('')
  const [rooms, setRooms] = useState([])
  const { isLoading, error, fetchRooms, setRoom, room } = useRoomStore()
  const { joinRoom } = useSettingsStore()
  const authParams = useAuthHttpParams()

  useEffect(() => {
    console.debug('fetch rooms')
    fetchRooms(authParams).then(rooms => setRooms(rooms))
  }, [authParams])

  const filteredOptions = rooms?.filter(o => o.description.includes(searchText))
  console.log('RoomSelect render', rooms?.length, filteredOptions.length)
  const handleSearch = (text) => setSearchText(text)

  const handleSelect = (value) => {
    console.log('handleSelect', value)
    setRoom(value)
  }

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

        <Button title={'join room'} onPress={joinRoom} disabled={!room} />
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
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  searchContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,

    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 10,
  },
  searchInput: {
    height: 40,
  },
  list: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  itemText: {
    padding: 10,
  },
})

export default RoomSelect