import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { baseStyles } from '../constants';

const LabeledInput = ({ label, value, onChangeText, ...props }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, baseStyles.text]}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
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
  input    : {
    borderWidth : 1,
    borderColor : '#ccc',
    padding     : 10,
    borderRadius: 5,
  },
});

export default LabeledInput;