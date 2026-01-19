import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import logger from '../services/logger';
import { useRoomStore } from '../zustand/fetchRooms';


const NAMESPACE = 'RoomSelectModal';

const RoomSelectModal = ({ open, toggleOpen, rooms }) => {
  logger.debug(NAMESPACE, 'RoomSelectModal rendered open', open, 'rooms', rooms);

  const [searchText, setSearchText] = useState();

  useEffect(() => {
    setSearchText(room?.description || '');
  }, [room]);

  const { setRoom, room } = useRoomStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const filteredOptions = rooms?.filter(o => {
    const _sText = searchText?.toLowerCase().trim();
    if (!_sText) return true;
    return o.description.toLowerCase().includes(_sText);
  });

  logger.debug(NAMESPACE, 'rooms rendered', filteredOptions.length, 'searchText', searchText);

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
    toggleOpen();
  };


  return (
    <Modal
      visible={open}
      onRequestClose={toggleOpen}
      animationType="none"
      presentationStyle="overFullScreen"
      supportedOrientations={['portrait']}
      keyboardShouldPersistTaps="always"
    >

      <KeyboardAvoidingView behavior={'padding'}
        style={[styles.modalContainer, {
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
          paddingLeft: insets.left + 8,
          paddingRight: insets.right + 8,
        }]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.searchInput, baseStyles.text]}
            placeholder={t('settings.search')}
            value={searchText}
            onChangeText={handleSearch}
            autoCorrect={false}
            autoComplete="off"
            placeholderTextColor="white"
          />
          <TouchableOpacity onPress={toggleOpen} style={styles.closeButton}>
            <Icon name="close" color="white" size={20} />
          </TouchableOpacity>
        </View>
        <View style={styles.listContainer}>
          {filteredOptions.length > 0 ? (
            <FlatList
              keyboardShouldPersistTaps={'handled'}
              style={styles.list}
              data={filteredOptions}
              keyExtractor={item => item.room}
              scrollEnabled={true}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelect(item)}>
                  <Text style={[styles.itemText, baseStyles.text]}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={[styles.itemText, baseStyles.text]}>
              {t('settings.noRoomsFound')}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal >
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  inputContainer: {
    position: 'relative',
    marginTop: 8,
  },
  searchInput: {
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#9e9e9e',
    backgroundColor: '#222',
    paddingHorizontal: 10,
    height: 40

  },
  listContainer: {
    flex: 1,
    marginBottom: 8,
  },
  list: {
    borderWidth: 1,
    borderColor: '#9e9e9e',
    borderRadius: 5,
    backgroundColor: '#222',
    marginTop: 10,
  },
  itemText: {
    padding: 10,
  },
  closeButton: {
    position: 'absolute',
    top: -20,
    right: -15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
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

export default RoomSelectModal;
