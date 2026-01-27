import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';

import { useInitsStore } from '../zustand/inits';
import { useSettingsStore } from '../zustand/settings';
import { useShidurStore } from '../zustand/shidur';
import { useUiActions } from '../zustand/uiActions';
import { KliOlamiFullscreenBtn } from './KliOlamiFullscreenBtn';
import commonStyles from './style';

export const KliOlami = () => {
  const { kliOlamiUrl } = useShidurStore();
  const { isShidur } = useSettingsStore();
  const { isPortrait } = useInitsStore();
  const { width, showBars } = useUiActions();

  return (
    <View
      style={[
        styles.container,
        !isShidur && !isPortrait && { width, alignSelf: 'center' },
      ]}
    >
      {
        kliOlamiUrl && (
          <RTCView
            streamURL={kliOlamiUrl}
            style={styles.viewer}
            objectFit="contain"
          />
        )
      }

      {
        showBars && kliOlamiUrl && (
          <View style={[commonStyles.toolbar, { justifyContent: 'flex-end' }]}>
            <View style={commonStyles.toolbarBtnsGroup}>
              <KliOlamiFullscreenBtn />
            </View>
          </View>
        )
      }
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
