import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ListInModal = (
  {
    items,
    selected,
    onSelect,
    onOpen,
    renderItem,
    open = false,
    trigger
  }
) => {
  const [visible, setVisible] = useState(open);
  const tooltipRef            = useRef(null);

  const toggleModal = () => {
    setVisible(!visible);
    onOpen && onOpen(!visible);
  };

  const handleSelect = (item) => {
    onSelect && onSelect(item);
    toggleModal();
  };

  const _renderItem = (item) => {
    const key = item.key ?? item.value ?? item.text ?? item.id;
    if (!key) return;

    return (
      <View key={key} style={styles.item}>
        <TouchableOpacity
          onPress={() => handleSelect(item)}
          style={[styles.item, selected && (item.value === selected && styles.selected)]}
        >
          {renderItem(item)}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity ref={tooltipRef} onPress={toggleModal}>
        {trigger ? trigger : <Text styles={styles.itemText}>{selected}</Text>}
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={toggleModal}
      >
        <TouchableWithoutFeedback onPress={toggleModal}>
          <View style={styles.modalContainer}>
            <View
              style={styles.tooltip}
              pointerEvents="auto"
            >

              <TouchableOpacity onPress={toggleModal} style={styles.close}>
                <Icon
                  name="close"
                  size={30}
                  color="white"
                />
              </TouchableOpacity>
              <ScrollView>
                {items.map(_renderItem)}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export const styles = StyleSheet.create({
  container     : {
    position: 'relative'
  },
  modalContainer: {
    flex           : 1,
    justifyContent : 'center',
    alignItems     : 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  tooltip       : {
    width          : '70%',
    maxHeight      : Dimensions.get('window').height * 0.8,
    bottom         : 0,
    borderRadius   : 5,
    elevation      : 5,
    shadowColor    : '#FFF',
    shadowOffset   : { width: 2, height: 2 },
    shadowOpacity  : 0.2,
    shadowRadius   : 2,
    alignSelf      : 'center',
    backgroundColor: '#1c1c1c',
    color          : 'white',
    paddingTop     : 15
  },
  selected      : {
    backgroundColor: '#222222'
  },
  close         : {
    position: 'absolute',
    top     : 0,
    right   : 0,
    zIndex  : 1
  }
});

export default ListInModal;