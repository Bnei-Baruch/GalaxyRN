import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { baseStyles } from '../constants';

const PageHeader = ({ page }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, baseStyles.text]}>Arvut-virtual ten</Text>
      <Text style={[styles.page, baseStyles.text]}>{page}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10
  },
  title    : {
    fontSize     : 14,
    textAlign    : 'center',
    textTransform: 'capitalize',
    width        : '100%'
  },
  page     : {
    fontWeight   : 'bold',
    fontSize     : 14,
    textAlign    : 'center',
    textTransform: 'capitalize',
    width        : '100%'
  }
});

export default PageHeader;