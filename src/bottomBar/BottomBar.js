import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { MuteBtn } from './MuteBtn';
import { CammuteBtn } from './CammuteBtn';
import { QuestionBtn } from './QuestionBtn';
import { AudioModeBtn } from './AudioModeBtn';
import { MoreBtn } from './MoreBtn';

export const BottomBar = () => {
  return (
    <View style={styles.container}>
      <MuteBtn />
      <CammuteBtn />
      <QuestionBtn />
      <AudioModeBtn />
      <MoreBtn />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position       : 'absolute',
    bottom         : 0,
    left           : 0,
    right          : 0,
    flexDirection  : 'row',
    alignItems     : 'flex-start',
    justifyContent : 'space-between',
    padding        : 10,
    backgroundColor: 'black',
    zIndex         : 1000
  }
});