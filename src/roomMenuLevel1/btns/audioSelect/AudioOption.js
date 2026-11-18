import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../../../components/CustomText';
import { baseStyles } from '../../../constants';
import { useShidurStore } from '../../../zustand/shidur';

const AudioOption = ({ streamKey, text, onSelect }) => {
  const isSelected = useShidurStore(state => state.audio?.key === streamKey);
  return (
    <TouchableOpacity
      testID={`audioOption-${streamKey}`}
      style={[styles.container, isSelected && styles.selected]}
      onPress={() => onSelect(streamKey)}
    >
      <Text style={[baseStyles.text, styles.text]}>{text}</Text>
      {isSelected && <Icon name="check" color="white" size={22} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  selected: {
    backgroundColor: '#3a3a3a',
  },
  text: {
    fontSize: 16,
  },
});
export default AudioOption;
