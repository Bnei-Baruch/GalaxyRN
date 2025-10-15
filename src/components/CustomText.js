import React from 'react';
import { Text as RNText } from 'react-native';

/**
 * Custom Text component that disables font scaling based on device settings
 * This ensures consistent font sizes across all devices regardless of user's accessibility settings
 */
const CustomText = ({ allowFontScaling = false, ...props }) => {
  return <RNText allowFontScaling={allowFontScaling} {...props} />;
};

export default CustomText;
