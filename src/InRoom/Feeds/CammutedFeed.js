import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../components/CustomText';

const CammutedFeed = ({ display }) => (
  <View style={styles.container}>
    <Text style={styles.displayTxt}>{display}</Text>
  </View>
);

export default CammutedFeed;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displayTxt: {
    color: 'white',
    fontSize: 20,
  },
});
