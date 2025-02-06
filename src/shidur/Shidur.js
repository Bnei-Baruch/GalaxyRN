import React from 'react';
import { StyleSheet, View, TouchableWithoutFeedback } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useShidurStore } from '../zustand/shidur';
import { PlayPauseBtn } from './PlayPauseBtn';
import { OptionsBtn } from './OptionsBtn';
import { PlayPauseOverlay } from './PlayPauseOverlay';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NO_VIDEO_OPTION_VALUE } from '../shared/consts';
import { useSettingsStore } from '../zustand/settings';
import { MuteBtn } from './MuteBtn';

const Shidur = () => {
  const { videoStream, isPlay, shidurBar, toggleShidurBar, video } = useShidurStore();
  const { audioMode }                                              = useSettingsStore();

  const toggleBar = () => toggleShidurBar();
  return (
    <View style={styles.container}>
      {
        isPlay ? (
          <View>
            <TouchableWithoutFeedback onPress={toggleBar}>
              {
                (video !== NO_VIDEO_OPTION_VALUE && !audioMode) ? (
                  <RTCView
                    streamURL={videoStream?.toURL()}
                    style={styles.viewer}
                  />
                ) : (
                  <View style={styles.noVideo}>
                    <Icon name="videocam-off" color="white" size={70} />
                  </View>
                )
              }
            </TouchableWithoutFeedback>
            {
              (shidurBar || !videoStream) && (
                <View style={styles.toolbar}>
                  <View style={styles.toolbarLeft}>
                    <PlayPauseBtn />
                    <MuteBtn />
                  </View>
                  <OptionsBtn />
                  {/*<FullscreenBtn />*/}
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
  container  : {
    alignItems    : 'center',
    width         : '100%',
    justifyContent: 'center'
  },
  viewer     : {
    aspectRatio   : 16 / 9,
    width         : '100%',
    justifyContent: 'center',
    alignItems    : 'center',
  },
  toolbar    : {
    padding        : 4,
    flexDirection  : 'row',
    justifyContent : 'space-between',
    alignItems     : 'center',
    width          : '100%',
    position       : 'absolute',
    bottom         : 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  toolbarLeft: {
    flexDirection: 'row',
    flexWrap     : 'nowrap',
    alignItems   : 'center'
  },
  noVideo    : {
    aspectRatio   : 16 / 9,
    width         : '100%',
    justifyContent: 'center',
    alignItems    : 'center',

  }
});

export default Shidur;