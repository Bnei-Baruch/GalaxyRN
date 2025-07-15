import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { baseStyles } from '../constants';

const IconWithText = ({ iconName, text }) => {
  return (
    <View style={styles.container}>
      <Icon name={iconName} size={25} color="white" />
      <Text style={[styles.text, baseStyles.text]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  text: {
    marginLeft: 5,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
});

export default IconWithText;
