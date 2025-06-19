// Core React and React Native imports
import React from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

// Third-party libraries
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RTCView } from 'react-native-webrtc';

// Local imports
import { baseStyles, SHIDUR_BAR_ZINDEX } from '../constants';
import { NO_VIDEO_OPTION_VALUE } from '../shared/consts';
import { useShidurStore } from '../zustand/shidur';
import { useUiActions } from '../zustand/uiActions';
import { FullscreenBtn } from './FullscreenBtn';
import { MuteBtn } from './MuteBtn';
import { OptionsBtn } from './OptionsBtn';
import { PlayPauseBtn } from './PlayPauseBtn';
import { PlayPauseOverlay } from './PlayPauseOverlay';
import Subtitle from './Subtitle';
import { SubtitleBtn } from './SubtitleBtn';

const Shidur = () => {
  const { videoStream, isPlay, video, isOnAir } = useShidurStore();
  const { toggleShowBars, showBars } = useUiActions();

  const { t } = useTranslation();

  const toggleBar = () => toggleShowBars();

  const streamURL = videoStream?.toURL();
  return (
    <View>
      {isPlay ? (
        <View>
          {isOnAir && (
            <Text style={[baseStyles.text, styles.onAir]}>
              {t('shidur.onAir')}
            </Text>
          )}
          <TouchableWithoutFeedback onPress={toggleBar}>
            {video !== NO_VIDEO_OPTION_VALUE && streamURL ? (
              <RTCView streamURL={streamURL} style={styles.viewer} />
            ) : (
              <View style={styles.noVideo}>
                <Icon name="graphic-eq" color="white" size={70} />
              </View>
            )}
          </TouchableWithoutFeedback>
          <Subtitle />
        </View>
      ) : (
        <PlayPauseOverlay />
      )}

      {(showBars || !isPlay) && (
        <View style={styles.toolbar}>
          <View style={styles.toolbarBtnsGroup}>
            <PlayPauseBtn />
            <MuteBtn />
          </View>

          <View style={styles.toolbarBtnsGroup}>
            <SubtitleBtn />
            <OptionsBtn />
            <FullscreenBtn />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  viewer: {
    aspectRatio: 16 / 9,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: SHIDUR_BAR_ZINDEX,
  },
  toolbarBtnsGroup: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  noVideo: {
    aspectRatio: 16 / 9,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onAir: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'red',
    zIndex: 10,
    fontSize: 20,
    padding: 10,
    borderRadius: 20,
  },
});

export default Shidur;
