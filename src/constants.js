import { Dimensions, StyleSheet } from 'react-native';

export const win = Dimensions.get('window');
export const w = win.width;
export const h = win.height;

export const baseStyles = StyleSheet.create({
  text: {
    color: 'white',
  },
  full: {
    flex: 1,
  },
  listItem: {
    padding: 10,
  },
  videoOverlay: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const SHIDUR_SUBTITLE_ZINDEX = 1;
export const SHIDUR_BAR_ZINDEX = 2;
