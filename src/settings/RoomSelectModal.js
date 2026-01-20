import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
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
import JoinRoomBtn from './JoinRoomBtn';

const NAMESPACE = 'RoomSelectModal';

const RoomSelectModal = () => {
  const { selectRoomOpen, setSelectRoomOpen } = useRoomStore();
  const { rooms, setRoom, room } = useRoomStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [searchText, setSearchText] = useState('');
  const refInput = useRef(null);

  useEffect(() => {
    room && setSearchText(room.description);
  }, [room]);


  const _sText = searchText?.toLowerCase().trim();
  const filteredOptions = useMemo(() => rooms?.filter(o => {
    if (!_sText) return true;
    return o.description.toLowerCase().includes(_sText);
  }), [_sText]);

  const handleSearch = text => {
    setSearchText(text);
    const _room = filteredOptions.find(
      o => o.description.toLowerCase() === text.toLowerCase()
    );

    if (_room) {
      setRoom(_room);
    }
  };

  const handleSelect = value => setRoom(value);

  const closeModal = () => {
    logger.debug(NAMESPACE, 'closeModal');
    setSelectRoomOpen(false);
  };

  const handleModalShow = () => {
    setTimeout(() => {
      refInput.current?.focus();
    }, 100);
  };


  return (
    <Modal
      visible={selectRoomOpen}
      onRequestClose={closeModal}
      onShow={handleModalShow}
      animationType="fade"
      presentationStyle="overFullScreen"
      supportedOrientations={['portrait']}
    >

      <KeyboardAvoidingView behavior={'padding'}
        style={[styles.modalContainer, {
          flex: 1,
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
            ref={refInput}
          />
          <JoinRoomBtn />

          <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
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
                <Pressable key={item.room} onPress={() => handleSelect(item)} style={styles.item}>
                  <Text style={[styles.itemText, baseStyles.text]}>
                    {item.description}
                  </Text>
                </Pressable>
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
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
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
    top: -25,
    right: 0,
  },
});

export default RoomSelectModal;
