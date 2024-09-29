import { StyleSheet, Text } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import React from 'react';
import useSoundStream from '../components/useSoundStream';

const Member = ({ member }) => {
  const { mid, display, video, audio } = member;
  console.log('render Member', audio, video);
  useSoundStream(audio);

  return (
    <>
      <Text>{mid}</Text>
      <Text>{display?.display}</Text>
      {video && (
        <RTCView streamURL={video.toURL()} style={styles.viewer} />
      )}

    </>
  );
};
export default Member;

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    padding        : 24,
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
