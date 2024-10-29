import { StyleSheet, Text, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import React from 'react';
import { memberItemWidth } from './helper';

const Member = ({ member }) => {
  const { mid, display, url } = member;
  console.log('render Member', display, mid, url);

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
    width          : memberItemWidth,
    backgroundColor: '#eaeaea',
  },
  viewer   : {
    aspectRatio    : 16 / 9,
    height         : 'auto',
    backgroundColor: 'black',
    justifyContent : 'center',
    alignItems     : 'center',
  },
  select   : {
    padding       : 24,
    flexDirection : 'row',
    justifyContent: 'space-between',
  }
});
