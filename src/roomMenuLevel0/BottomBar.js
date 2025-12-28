import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { baseStyles } from '../constants';
import { AudioModeBtn } from './bottomBarBtns/AudioModeBtn';
import { CammuteBtn } from './bottomBarBtns/CammuteBtn';
import { MoreBtn } from './bottomBarBtns/MoreBtn';
import { MuteBtn } from './bottomBarBtns/MuteBtn';
import { QuestionBtn } from './bottomBarBtns/QuestionBtn';

export const BottomBar = () => {
  return (
    <View style={[styles.container, baseStyles.panelBackground]}>
      <MuteBtn />
      <CammuteBtn />
      <QuestionBtn />
      <AudioModeBtn />
      <View style={styles.devider}></View>
      <MoreBtn />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 340,
    maxWidth: '100%',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 32,
  },
  devider: {
    width: 1,
    backgroundColor: '#333',
    marginLeft: 4,
    marginRight: 4,
    marginTop: 16,
    marginBottom: 16,
  },
});
