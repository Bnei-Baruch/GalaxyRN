import { StyleSheet } from 'react-native';
import { baseStyles } from '../../constants';

export const topMenuBtns = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    ...baseStyles.listItem,
  },
  menuItemText: {
    paddingHorizontal: 5,
    ...baseStyles.text,
  },
  firstBtn: {
    marginLeft: 0,
    paddingLeft: 0,
  },
});
