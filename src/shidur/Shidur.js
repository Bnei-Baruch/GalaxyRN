import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useShidurStore } from '../zustand/shidur';
import { PlayPauseBtn } from './PlayPauseBtn';
import { OptionsBtn } from './OptionsBtn';
import { useInitsStore } from '../zustand/inits';
import { PlayPauseOverlay } from './PlayPauseOverlay';

export const Shidur = () => {
  const { videoUrl, isPlay, cleanShidur, shidurBar, toggleShidurBar } = useShidurStore();
  const { isPortrait }                                                = useInitsStore();

  useEffect(() => {
    return cleanShidur;
  }, []);

  const toggleBar = () => {
    console.log('Shidur toggleBar');
    toggleShidurBar();
  };

  return (
    <View style={styles.container}>
      {
        isPlay ? (
          <View>
            <TouchableWithoutFeedback onPress={toggleBar}>
              <RTCView
                streamURL={videoUrl}
                style={[styles.viewer, isPortrait ? styles.portrait : styles.landscape]}
              />
            </TouchableWithoutFeedback>
            {
              shidurBar && (
                <View style={styles.toolbar}>
                  <PlayPauseBtn />
                  <OptionsBtn />
                </View>
              )
            }
          </View>
        ) : <PlayPauseOverlay />
      }
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
    padding        : 4,
    flexDirection  : 'row',
    justifyContent : 'space-between',
    alignItems     : 'center',
    width          : '100%',
    position       : 'absolute',
    bottom         : 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  }
});
