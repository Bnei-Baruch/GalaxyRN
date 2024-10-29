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

const TooltipList = ({ items, selected, onSelect, renderItem, open = false, trigger }) => {
  const [visible, setVisible] = useState(open);
  const tooltipRef            = useRef(null);

  const toggleTooltip = () => setVisible(!visible);

  const handleSelect = (item) => {
    onSelect && onSelect(item);
    toggleTooltip();
  };

  const _renderItem = (item) => {
    const key = item.key ?? item.value ?? item.text;
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
      <TouchableOpacity ref={tooltipRef} onPress={toggleTooltip}>
        {trigger ? trigger : <Text styles={styles.itemText}>{selected}</Text>}
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={toggleTooltip}
      >
        <TouchableWithoutFeedback onPress={toggleTooltip}>
          <View style={styles.modalContainer}>
            <View
              style={styles.tooltip}
              pointerEvents="auto"
            >
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
    position: 'relative',
  },
  modalContainer: {
    flex          : 1,
    justifyContent: 'center',
    alignItems    : 'center',
  },
  tooltip       : {
    width          : '70%',
    maxHeight      : Dimensions.get('window').height * 0.8,
    bottom         : 0,
    padding        : 10,
    borderRadius   : 5,
    elevation      : 5, // Android shadow
    shadowColor    : '#000', // iOS shadow
    shadowOffset   : { width: 0, height: 2 },
    shadowOpacity  : 0.2,
    shadowRadius   : 2,
    alignSelf      : 'center',
    backgroundColor: 'black',
    color          : 'white'
  },
  item          : {
    padding: 5,

  },
  selected      : {
    backgroundColor: '#222222'
  }
});

export default TooltipList;