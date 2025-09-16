import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTranslation } from 'react-i18next';
import { baseStyles } from '../constants';
import { useInRoomStore } from '../zustand/inRoom';
import { topMenuBtns } from './helper';

export const LeaveBtn = () => {
  const { exitRoom } = useInRoomStore();
  const { t } = useTranslation();

  const handlePress = () => exitRoom();

  return (
    <TouchableOpacity onPress={handlePress} style={styles.btn}>
      <Text style={styles.text}>{t('bottomBar.leave')}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    ...topMenuBtns.btn,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'red',
    borderRadius: 5,
  },
  text: {
    ...baseStyles.text,
    color: 'white',
  },
});
