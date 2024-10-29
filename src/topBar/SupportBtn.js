import * as React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from './helper';
import { useSettingsStore } from '../zustand/settings';
import { baseStyles } from '../constants';

export const SupportBtn = () => {
  const { uiLang }  = useSettingsStore();
  const isHe        = uiLang === 'he';
  const handlePress = () => {
    console.log('support');
  };
  return (
    <TouchableOpacity onPress={handlePress} style={topMenuBtns.btn}>
      <Icon name="contact-support" size={30} color="black" />
      <Text style={baseStyles.text}>{'oldClient.support'}</Text>
    </TouchableOpacity>
  );
};
