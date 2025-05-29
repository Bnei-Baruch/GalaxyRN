// Core React and React Native imports
import React from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

// Third-party libraries
import { RTCView } from 'react-native-webrtc';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Local imports
import { useShidurStore } from '../zustand/shidur';
import { NO_VIDEO_OPTION_VALUE } from '../shared/consts';
import { baseStyles } from '../constants';
import { PlayPauseBtn } from './PlayPauseBtn';
import { SubtitleBtn } from './SubtitleBtn';
import { OptionsBtn } from './OptionsBtn';
import { PlayPauseOverlay } from './PlayPauseOverlay';
import { MuteBtn } from './MuteBtn';
import { FullscreenBtn } from './FullscreenBtn';

const Shidur = () => {
  const { videoStream, isPlay, shidurBar, toggleShidurBar, video, isOnAir } = useShidurStore();

  const { t } = useTranslation();

  const toggleBar = () => toggleShidurBar();

  const streamURL = videoStream?.toURL();
  return (
    <View>
      {
        isPlay ? (
          <View>
            {
              isOnAir && (
                <Text style={[baseStyles.text, styles.onAir]}>
                  {t('shidur.onAir')}
                </Text>
              )
            }
            <TouchableWithoutFeedback onPress={toggleBar}>
              {
                (video !== NO_VIDEO_OPTION_VALUE && streamURL) ? (
                  <RTCView
                    streamURL={streamURL}
                    style={styles.viewer}
                  />
                ) : (
                  <View style={styles.noVideo}>
                    <Icon name="graphic-eq" color="white" size={70} />
                  </View>
                )
              }
            </TouchableWithoutFeedback>
          </View>
        ) : <PlayPauseOverlay />
      }

      {
        (shidurBar || !isPlay) && (
          <View style={styles.toolbar}>
            <View style={styles.toolbarBtnsGroup}>
              <PlayPauseBtn />
              <MuteBtn />
            </View>

            <View style={styles.toolbarBtnsGroup}>
              <OptionsBtn />
              <SubtitleBtn />
              <FullscreenBtn />
            </View>
          </View>
        )
      }
    </View>
  );
};

const styles = StyleSheet.create({
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
  toolbarBtnsGroup: {
    flexDirection: 'row',
    flexWrap     : 'nowrap',
    alignItems   : 'center'
  },
  noVideo    : {
    aspectRatio   : 16 / 9,
    width         : '100%',
    justifyContent: 'center',
    alignItems    : 'center',

  },
  onAir      : {
    position       : 'absolute',
    top            : 10,
    right          : 10,
    backgroundColor: 'red',
    zIndex         : 10,
    fontSize       : 20,
    padding        : 10,
    borderRadius   : 20
  }
});

export default Shidur;