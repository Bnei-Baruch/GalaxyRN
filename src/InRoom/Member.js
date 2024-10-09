import { StyleSheet, Text, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import React from 'react';

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
    width          : '50%',
    backgroundColor: '#eaeaea',
  },
  viewer   : {
    aspectRatio: 16 / 9,
    // marginTop: 16,
    height: 'auto',
    // width: '100%',
    backgroundColor: 'black',
    justifyContent : 'center',
    alignItems     : 'center',
  },
  select   : {
    padding       : 24,
    flexDirection : 'row',
    justifyContent: 'space-between',
    // justifyContent: 'left',
  },
  video    : {
    // flex:2
  },
});
