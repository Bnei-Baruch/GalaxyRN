import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MemberNoVideo = ({ member }) => {
  const { mid, display, url, talk } = member;
  console.log('render Member', display, mid, url);

  return (
    <View style={styles.container}>
      <Icon name="point" color={talk ? 'red' : 'green'} size={20} />
      <Text>{display?.display}</Text>

    </View>
  );
};
export default MemberNoVideo;

const styles = StyleSheet.create({
  container: {
    width          : '50%',
    backgroundColor: '#222222B2',
  }
});
