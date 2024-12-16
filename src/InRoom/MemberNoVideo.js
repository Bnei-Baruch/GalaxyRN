import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useInRoomStore } from '../zustand/inRoom';

const MemberNoVideo = ({ id }) => {
  const { memberByFeed } = useInRoomStore();

  const { display, talk } = memberByFeed[id];

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
