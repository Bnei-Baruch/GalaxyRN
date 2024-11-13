import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useShidurStore } from '../zustand/shidur';
import { PlayPauseBtn } from './PlayPauseBtn';
import { OptionsBtn } from './OptionsBtn';
import { useInitsStore } from '../zustand/inits';
import { PlayPauseOverlay } from './PlayPauseOverlay';

export const Shidur = () => {
  const { videoUrl, isPlay, cleanShidur } = useShidurStore();
  const { isPortrait }                    = useInitsStore();

  useEffect(() => {
    return () => {
      cleanShidur();
    };
  }, []);

  return (
    <View style={styles.container}>
      {
        isPlay ? (
          <RTCView
            streamURL={videoUrl}
            style={[styles.viewer, isPortrait ? styles.portrait : styles.landscape]}
          />
        ) : <PlayPauseOverlay />
      }

      <View style={styles.toolbar}>
        <PlayPauseBtn />
        <OptionsBtn />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems    : 'center',
    width         : '100%',
    justifyContent: 'center'
  },
  viewer   : {
    aspectRatio   : 16 / 9,
    width         : '100%',
    justifyContent: 'center',
    alignItems    : 'center',
  },
  toolbar  : {
    padding       : 4,
    flexDirection : 'row',
    justifyContent: 'space-between',
    width         : '100%',
  }
});
