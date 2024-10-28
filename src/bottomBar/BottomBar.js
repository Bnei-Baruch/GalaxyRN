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
    flexDirection  : 'row',
    alignItems     : 'flex-start',
    justifyContent : 'space-between',
    padding        : 10,
    backgroundColor: 'black'
  }
});