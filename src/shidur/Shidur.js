import React from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Text } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useShidurStore } from '../zustand/shidur';
import { PlayPauseBtn } from './PlayPauseBtn';
import { OptionsBtn } from './OptionsBtn';
import { PlayPauseOverlay } from './PlayPauseOverlay';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NO_VIDEO_OPTION_VALUE } from '../shared/consts';
import { useSettingsStore } from '../zustand/settings';
import { MuteBtn } from './MuteBtn';
import { useTranslation } from 'react-i18next';
import { baseStyles } from '../constants';
import { FullscreenBtn } from './FullscreenBtn';

const Shidur = () => {
  const { videoStream, isPlay, shidurBar, toggleShidurBar, video, isOnAir } = useShidurStore();
  const { audioMode }                                                       = useSettingsStore();

  const { t } = useTranslation();

  const toggleBar = () => toggleShidurBar();

  const streamURL = videoStream?.toURL();
  return (
    <>
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
                (video !== NO_VIDEO_OPTION_VALUE && !audioMode && streamURL) ? (
                  <RTCView
                    streamURL={streamURL}
                    style={styles.viewer}
                  />
                ) : (
                  <View style={styles.noVideo}>
                    <Icon name="videocam-off" color="white" size={70} />
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
              <FullscreenBtn />
            </View>
          </View>
        )
      }
    </>
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