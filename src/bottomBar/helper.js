import { StyleSheet, Dimensions } from 'react-native';
import { topMenuBtns } from '../topBar/helper';
import { baseStyles } from '../constants';

const { width, height } = Dimensions.get('window');
const buttonSize = Math.min(Math.min(width, height) /5, 75);

export const bottomBar = StyleSheet.create({
  btn       : {
    alignItems     : 'center',
    justifyContent : 'center',
    width          : buttonSize,
    height         : buttonSize,
    borderRadius   : buttonSize / 2,
    backgroundColor: 'rgba(34, 34, 34, 1)'
  },
  moreSelBtn: {
    backgroundColor: 'gray'
  }
});