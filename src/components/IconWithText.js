import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { baseStyles } from '../constants';

const IconWithText = ({ iconName, text }) => {
  return (
    <View style={styles.container}>
      <Icon name={iconName} size={20} color="white" />
      <Text style={[styles.text, baseStyles.text]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems   : 'center',
  },
  text     : {
    marginLeft: 5,
  },
});

export default IconWithText;