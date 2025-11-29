import React from 'react';
import { Text as RNText } from 'react-native';

/**
 * Custom Text component that disables font scaling based on device settings
 * This ensures consistent font sizes across all devices regardless of user's accessibility settings
 */
const CustomText = React.forwardRef(({ allowFontScaling = false, ...props }, ref) => {
  return <RNText ref={ref} allowFontScaling={allowFontScaling} {...props} />;
});

CustomText.displayName = 'CustomText';

export default CustomText;
