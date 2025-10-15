import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Text from '../../components/CustomText';
import { baseStyles } from '../../constants';
import { useShidurStore } from '../../zustand/shidur';

const AudioOption = ({ streamKey, icon, text, onSelect }) => {
  const { audio } = useShidurStore();
  const isSelected = audio.key === streamKey;
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selected]}
      onPress={() => onSelect(streamKey)}
    >
      <Icon name={icon} color="white" size={20} />
      <Text style={[baseStyles.text, baseStyles.listItem]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
  },
  selected: {
    backgroundColor: '#222222',
  },
});

export default AudioOption;
