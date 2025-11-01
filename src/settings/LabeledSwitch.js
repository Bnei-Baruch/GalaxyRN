import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';

const LabeledSwitch = ({ label, value, onValueChange }) => {
  const toggleSwitch = () => onValueChange(!value);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, baseStyles.text]}>{label}</Text>
      <Switch
        // trackColor={{ false: '#767577', true: '#81b0ff' }}
        // thumbColor={value ? '#f5dd4b' : '#f4f3f4'}
        // ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 16,
  },
});

export default LabeledSwitch;
