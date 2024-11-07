import { StyleSheet, Text, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import React from 'react';
import { useInRoomStore } from '../zustand/inRoom';

const Member = ({ id }) => {
  const { memberByFeed }      = useInRoomStore();
  const { mid, display, url } = memberByFeed[id];

  return (
    <View style={styles.container}>
      <Text>{mid}</Text>
      <Text>{display?.display}</Text>
      {url && <RTCView streamURL={url} style={styles.viewer} />}
    </View>
  );
};
export default Member;

const styles = StyleSheet.create({
  container: {
    width          : '49%',
    backgroundColor: '#eaeaea',
  },
  viewer   : {
    aspectRatio    : 16 / 9,
    backgroundColor: 'black',
    justifyContent : 'space-between',
  },
  select   : {
    padding       : 24,
    flexDirection : 'row',
    justifyContent: 'space-between',
  }
});
