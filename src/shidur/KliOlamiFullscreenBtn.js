import * as React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from '../roomMenuLevel1/btns/helper';
import { useSettingsStore } from '../zustand/settings';

export const KliOlamiFullscreenBtn = () => {
  const { isKliOlamiFullscreen, toggleIsKliOlamiFullscreen } = useSettingsStore();

  const handlePress = () => toggleIsKliOlamiFullscreen();

  return (
    <Icon
      name={!isKliOlamiFullscreen ? 'fullscreen' : 'fullscreen-exit'}
      size={30}
      color="white"
      onPress={handlePress}
      style={topMenuBtns.btn}
    />
  );
};
