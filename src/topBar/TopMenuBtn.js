import * as React from 'react';
import { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StudyMaterialsBtn } from './StudyMaterialsBtn';
import { DonateBtn } from './DonateBtn';
import { SupportBtn } from './SupportBtn';
import { SettingsBtn } from './SettingsBtn';

export const TopMenuBtn = () => {
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
    <View style={styles.menuContainer}>
      <TouchableOpacity onPress={toggleOpen}>
        <Icon name="menu" size={30} color="black" />
      </TouchableOpacity>
      <Animated.View style={[styles.menu, { height: menuHeight }]}>
        <StudyMaterialsBtn />
        <DonateBtn />
        <SupportBtn />
        <SettingsBtn />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container    : {
    flexDirection : 'row',
    alignItems    : 'flex-start',
    justifyContent: 'space-between',
    padding       : 10,
  },
  menuContainer: {
    //position: 'relative',
  },
  menu         : {
    position       : 'absolute', // Position the menu absolutely
    top            : 30, // Adjust vertical position as needed
    left           : 0, // Adjust horizontal position
    backgroundColor: 'white',
    borderRadius   : 5,
    elevation      : 5,
    shadowColor    : '#000',
    shadowOffset   : { width: 0, height: 2 },
    shadowOpacity  : 0.3,
    shadowRadius   : 2,
    minWidth       : 100
    //overflow       : 'hidden', // Hide content overflow during animation
  },
  menuItem     : {
    padding   : 10,
    fontSize  : 16,
    whiteSpace: 'nowrap',
  },
});