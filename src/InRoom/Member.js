import { StyleSheet, Text, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import React from 'react';
import { useInRoomStore } from '../zustand/inRoom';

const Member = ({ id }) => {
  const { memberByFeed } = useInRoomStore();
  console.log('Member render', id, memberByFeed[id]);

  const { mid, display, url } = memberByFeed[id];
  return (
    <View style={styles.container}>
      <View style={styles.display}>
        <Text style={styles.displayMark}>.</Text>
        <Text style={styles.displayText}>{display?.display}</Text>
      </View>
      {url && <RTCView streamURL={url} style={styles.viewer} />}
    </View>
  );
};
export default Member;

const styles = StyleSheet.create({
  container  : {
    width          : '49%',
    backgroundColor: '#eaeaea',
  },
  display    : {
    position       : 'absolute',
    left           : 0,
    top            : 0,
    backgroundColor: 'rgba(34, 34, 34, .7)',
    flexDirection  : 'row',
    flexWrap       : 'wrap',
    padding        : 4,
    zIndex         : 1
  },
  displayMark: {
    color            : 'red',
    fontSize         : 30,
    lineHeight       : 18,
    paddingRight: 5
  },
  displayText: {
    color: 'white',
  },
  viewer     : {
    aspectRatio    : 16 / 9,
    backgroundColor: 'black',
    justifyContent : 'space-between',
  },
  select     : {
    padding       : 24,
    flexDirection : 'row',
    justifyContent: 'space-between',
  }
});
