import React from 'react';
import { TextInput as RNTextInput } from 'react-native';

/**
 * Custom TextInput component that disables font scaling based on device settings
 * This ensures consistent font sizes across all devices regardless of user's accessibility settings
 */
const CustomTextInput = ({ allowFontScaling = false, ...props }) => {
  return <RNTextInput allowFontScaling={allowFontScaling} {...props} />;
};

export default CustomTextInput;
