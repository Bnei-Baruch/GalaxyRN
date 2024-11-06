import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { baseStyles } from '../constants';

const LabeledInput = ({ label, disabled, ...props }) => {
  const _input = disabled ? <Text style={[styles.input, styles.disabled]}>{props.value}</Text>
    : <TextInput style={[styles.input, baseStyles.text]} {...props} />;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, baseStyles.text]}>{label}</Text>
      {_input}
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
    borderColor : 'rgba(255, 255, 255, 0.23)',
    padding     : 10,
    borderRadius: 5,
  },
  disabled : {
    color: 'grey',
  }
});

export default LabeledInput;