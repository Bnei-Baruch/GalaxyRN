import * as React from 'react';
import { useState, useRef } from 'react';
import { TouchableOpacity, Animated, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from './helper';
import { baseStyles } from '../constants';

export const StudyMaterialsBtn = () => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () => {
    if (open) {
      // Close the menu with animation
      Animated.timing(menuHeight, {
        toValue        : 0,
        duration       : 300, // Adjust animation duration as needed
        useNativeDriver: false, // 'false' for layout animations
      }).start();
    } else {
      // Open the menu with animation
      Animated.timing(menuHeight, {
        toValue        : 100, // Adjust height based on menu content
        duration       : 300,
        useNativeDriver: false,
      }).start();
    }
    setOpen(!open);
  };

  const menuHeight = useRef(new Animated.Value(0)).current;

  return (
    <TouchableOpacity onPress={toggleOpen} style={topMenuBtns.btn}>
      <Icon name="library-books" size={30} color="black" />
      <Text style={baseStyles.text}>{'oldClient.material'}</Text>
    </TouchableOpacity>
  );
};
