import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const FeedDisplay = ({ display }) => (
  <View style={styles.container}>
    <Text style={styles.mark}>.</Text>
    <Text style={styles.text}>{display}</Text>
  </View>
);
export default FeedDisplay;

const styles = StyleSheet.create({
  container: {
    position       : 'absolute',
    left           : 0,
    top            : 0,
    backgroundColor: 'rgba(34, 34, 34, .7)',
    flexDirection  : 'row',
    flexWrap       : 'wrap',
    padding        : 4,
    zIndex         : 1
  },
  mark     : {
    color       : 'red',
    fontSize    : 30,
    lineHeight  : 18,
    paddingRight: 5
  },
  text     : {
    color: 'white',
  },
});
