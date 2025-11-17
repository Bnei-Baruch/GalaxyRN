import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './CustomText';
import { baseStyles } from '../constants';

const TextDisplayWithButton = ({ label, children }) => {
  return (
    <View style={styles.container}>
      {label && (
        <View style={[styles.labelContainer, baseStyles.viewBackground]}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <View style={styles.displayContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    marginBottom: 5,
    position: 'relative',
  },
  labelContainer: {
    position: 'absolute',
    top: -9,
    left: 10,
    paddingHorizontal: 5,
    zIndex: 1,
  },
  label: {
    color: 'white',
    fontSize: 12,
  },
  displayContainer: {
    borderWidth: 1,
    borderColor: '#9e9e9e',
    height: 40,
    borderRadius: 5,
  },
});

export default TextDisplayWithButton;
