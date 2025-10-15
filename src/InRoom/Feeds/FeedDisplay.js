import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../../components/CustomText';
const FeedDisplay = ({ display, talking }) => (
  <View style={styles.container}>
    {!talking && (
      <Icon name={'mic-off'} color={'red'} size={14} style={styles.icon} />
    )}
    <Text style={styles.text}>{display}</Text>
  </View>
);
export default FeedDisplay;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(34, 34, 34, .7)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mark: {
    color: 'red',
    fontSize: 30,
    lineHeight: 18,
    paddingRight: 5,
  },
  text: {
    color: 'white',
  },
  icon: {
    marginRight: 4,
  },
});
