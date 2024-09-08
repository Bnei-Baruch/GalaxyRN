import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const IconWithText = ({ iconName, text }) => {
  return (
    <View style={styles.container}>
      <Icon name={iconName} size={20} color="blue" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 5,
  },
});

export default IconWithText;