import * as React from 'react';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useSettingsStore } from '../../zustand/settings';
import { bottomBar } from '../helper';

const PRESS_DISABLE_MS = 3000;

// Broadcast video on/off for the broadcast-only bottom bar. Uses audio mode,
// which is what turns the broadcast video off (and back on) everywhere else.
export const ShidurVideoBtn = () => {
  const { audioMode, toggleAudioMode } = useSettingsStore();
  const [disabled, setDisabled] = React.useState(false);

  const handlePress = () => {
    toggleAudioMode();
    setDisabled(true);
    setTimeout(() => setDisabled(false), PRESS_DISABLE_MS);
  };

  return (
    <Pressable
      testID="shidurVideoBtn"
      accessibilityLabel="shidurVideoBtn"
      onPress={handlePress}
      disabled={disabled}
      style={bottomBar.btn}
    >
      <BottomBarIconWithText
        iconName={audioMode ? 'videocam-off' : 'videocam'}
        text=""
        extraStyle={
          audioMode
            ? ['toggle_on', 'toggle_on_icon']
            : ['toggle_off', 'toggle_off_icon']
        }
        showtext={false}
      />
    </Pressable>
  );
};
