import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';

import { useInitsStore } from '../zustand/inits';
import { useSettingsStore } from '../zustand/settings';
import { useShidurStore } from '../zustand/shidur';
import { useUiActions } from '../zustand/uiActions';

export const Quads = () => {
  const { quadUrl, initQuad, cleanQuads } = useShidurStore();
  const { isShidur } = useSettingsStore();
  const { isPortrait } = useInitsStore();
  const { width } = useUiActions();

  useEffect(() => {
    initQuad();
    return () => {
      cleanQuads();
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        !isShidur && !isPortrait && { width, alignSelf: 'center' },
      ]}
    >
      {quadUrl && (
        <RTCView
          streamURL={quadUrl}
          style={styles.viewer}
          objectFit="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  viewer: {
    aspectRatio: 16 / 9,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
