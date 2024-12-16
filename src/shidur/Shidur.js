import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Button } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useShidurStore } from '../zustand/shidur';
import { PlayPauseBtn } from './PlayPauseBtn';
import { OptionsBtn } from './OptionsBtn';
import { useInitsStore } from '../zustand/inits';
import { PlayPauseOverlay } from './PlayPauseOverlay';

export const Shidur = () => {
  const { videoUrl, isPlay, cleanShidur, talking, streamGalaxy, exitAudioMode, enterAudioMode } = useShidurStore();
  const { isPortrait }                                                                          = useInitsStore();

  const [isFor, setIsFor] = useState(false);

  useEffect(() => {
    return () => {
      cleanShidur();
    };
  }, []);

  const toggleForeground = () => {
    if (isFor)
      exitAudioMode();
    else
      enterAudioMode();
    setIsFor(!isFor);
  };

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
          title={talking ? 'on air' : 'off air'}
          onPress={() => streamGalaxy(!talking)}
          color={talking ? 'red' : 'green'}
        />
        <Button
          title={isFor ? 'in background' : 'active'}
          onPress={toggleForeground}
          color={isFor ? 'red' : 'green'}
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
