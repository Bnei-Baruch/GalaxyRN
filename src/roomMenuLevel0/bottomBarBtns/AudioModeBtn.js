import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useSettingsStore } from '../../zustand/settings';
import { bottomBar } from '../helper';

const PRESS_DISABLE_MS = 3000;

export const AudioModeBtn = () => {
  const { audioMode, toggleAudioMode } = useSettingsStore();
  const { t } = useTranslation();
  const [disabled, setDisabled] = React.useState(false);
  const handlePress = () => {
    toggleAudioMode();
    setDisabled(true);
    setTimeout(() => setDisabled(false), PRESS_DISABLE_MS);
  };
  let iconName, text, extraStyle;
  if (!audioMode) {
    iconName = 'hearing';
    text = t('bottomBar.showBroadcast');
    extraStyle = ['toggle_off', 'toggle_off_icon'];
  } else {
    iconName = 'hearing';
    text = t('bottomBar.hideBroadcast');
    extraStyle = ['toggle_on', 'toggle_on_icon'];
  }
  return (
    <Pressable
      testID="audioModeBtn"
      accessibilityLabel="audioModeBtn"
      onPress={handlePress}
      disabled={disabled}
      style={bottomBar.btn}
    >
      <BottomBarIconWithText
        iconName={iconName}
        text={text}
        extraStyle={extraStyle}
        showtext={false}
      />
    </Pressable>
  );
};
