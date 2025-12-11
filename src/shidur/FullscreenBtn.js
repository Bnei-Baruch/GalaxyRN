import * as React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from '../bottomBar/moreBtns/helper';
import { useSettingsStore } from '../zustand/settings';

export const FullscreenBtn = () => {
  const { isFullscreen, toggleIsFullscreen } = useSettingsStore();

  const handlePress = () => toggleIsFullscreen();

  return (
    <Icon
      name={!isFullscreen ? 'fullscreen' : 'fullscreen-exit'}
      size={30}
      color="white"
      onPress={handlePress}
      style={topMenuBtns.btn}
    />
  );
};
