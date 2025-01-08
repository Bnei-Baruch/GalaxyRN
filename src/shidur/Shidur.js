import React from 'react';
import { StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useShidurStore } from '../zustand/shidur';
import { PlayPauseBtn } from './PlayPauseBtn';
import { OptionsBtn } from './OptionsBtn';
import { PlayPauseOverlay } from './PlayPauseOverlay';

const Shidur = () => {
  const { videoStream, isPlay, shidurBar, toggleShidurBar } = useShidurStore();

  const toggleBar = () => toggleShidurBar();

  return (
    <View style={styles.container}>
      {
        isPlay && videoStream ? (
          <View>
            <TouchableWithoutFeedback onPress={toggleBar}>
              <RTCView
                streamURL={videoStream.toURL()}
                style={styles.viewer}
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

export default Shidur;