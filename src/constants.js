import { Dimensions, StyleSheet } from 'react-native';

export const win = Dimensions.get('window');
export const w = win.width;
export const h = win.height;

export const baseStyles = StyleSheet.create({
  text: {
    color: '#ddd',
  },
  full: {
    flex: 1,
  },
  listItem: {
    padding: 10,
  },
  listItemSelected: {
    padding: 10,
    backgroundColor: '#444',
  },
  videoOverlay: {
    flex: 1,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {

    backgroundColor: '#101010',
    borderColor: '#101010',
  },
  viewBackground: {
    backgroundColor: '#101010',
  },
  panelBackground: {
    backgroundColor: '#222',
  },
});

export const SHIDUR_SUBTITLE_ZINDEX = 1;
export const SHIDUR_BAR_ZINDEX = 2;


export const STORAGE_KEYS = {
  ROOM: 'room',
  CAMMUTE: 'cammute',
  VIDEO: 'video',
  AUDIO: 'audio',
  LANGUAGE: 'lng',
  IS_SUBTITLES: 'is_subtitles',
  IS_AUDIO_MODE: 'is_audio_mode',
  IS_ORIGINAL: 'is_original',
  USER_SESSION: 'user_session',
};

