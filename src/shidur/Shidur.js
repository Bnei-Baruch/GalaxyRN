import React, { useEffect } from 'react';
import { StyleSheet, View, Button } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useShidurStore } from '../zustand/shidur';
import { PlayPauseBtn } from './PlayPauseBtn';
import { OptionsBtn } from './OptionsBtn';
import { useInitsStore } from '../zustand/inits';
import { PlayPauseOverlay } from './PlayPauseOverlay';

export const Shidur = () => {
  const { videoUrl, isPlay, toggleTalking, talking, cleanShidur } = useShidurStore();
  const { isPortrait }                                            = useInitsStore();

  useEffect(() => {
    return () => {
      cleanShidur();
    };
  }, []);


  console.log("Shidur render", isPlay)
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
        <Button
          title="toggle on air"
          onPress={toggleTalking}
          style={{ backgroundColor: talking ? 'red' : 'green' }}
        />
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
  //portrait : { width: '100%' },
  //landscape: { height: '100%' },
  viewer : {
    aspectRatio   : 16 / 9,
    width         : '100%',
    justifyContent: 'center',
    alignItems    : 'center',
  },
  toolbar: {
    padding       : 4,
    flexDirection : 'row',
    justifyContent: 'space-between',
    width         : '100%',
  }
});
