import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { baseStyles } from '../constants';

const LabeledSelect = ({ label, options, selectedValue, onValueChange }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, baseStyles.text]}>{label}</Text>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        {options.map((option) => (
          <Picker.Item
            key={option.key || option.value}
            label={option.text}
            value={option.value}
            style={baseStyles.text}
          />
        ))}
      </Picker>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label    : {
    fontSize    : 16,
    marginBottom: 5,
  },
  picker   : {
    borderWidth : 1,
    borderColor : '#ccc',
    borderRadius: 5,
    color       : 'white'
  },
});

export default LabeledSelect;
