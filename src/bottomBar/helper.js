import { StyleSheet, Dimensions } from 'react-native';
import { topMenuBtns } from '../topBar/helper';
import { baseStyles } from '../constants';

const { width, height } = Dimensions.get('window');
const buttonSize = Math.min(Math.min(width, height) /4, 95);

export const bottomBar = StyleSheet.create({
  btn       : {
    flexGrow      : 1,
    marginHorizontal: 4,
  },
  moreSelBtn: {
    marginHorizontal: 4,
    // backgroundColor:'gray'
  }
});