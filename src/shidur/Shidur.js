// Core React and React Native imports
import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

// Third-party libraries
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RTCView } from 'react-native-webrtc';
import Text from '../components/CustomText';
import logger from '../services/logger';
import { useSubtitleStore } from '../zustand/subtitle';

// Local imports
import WIP from '../components/WIP';
import { baseStyles, SHIDUR_BAR_ZINDEX } from '../constants';
import { withProfiler } from '../libs/sentry/sentryHOC';
import { NO_VIDEO_OPTION_VALUE } from '../shared/consts';
import { useShidurStore } from '../zustand/shidur';
import { useUiActions } from '../zustand/uiActions';
import { FullscreenBtn } from './FullscreenBtn';
import { MuteBtn } from './MuteBtn';
import OptionsBtn from './OptionsBtn';
import { OriginalSwitch } from './OriginalSwitch';
import { PlayPauseBtn } from './PlayPauseBtn';
import { PlayPauseOverlay } from './PlayPauseOverlay';
import Subtitle from './Subtitle';
import { SubtitleBtn } from './SubtitleBtn';

const NAMESPACE = 'Shidur';

const Shidur = () => {
  const { url, isPlay, video, isOnAir, audio, shidurWIP, cleanWIP } =
    useShidurStore();
  const audioKey = audio?.key;
  const { init: initSubtitle, exit: exitSubtitle } = useSubtitleStore();
  const { showBars } = useUiActions();

  const { t } = useTranslation();

  useEffect(() => {
    if (audioKey) {
      initSubtitle();
    }
    return () => {
      exitSubtitle();
    };
  }, [audioKey]);

  return (
    <View style={styles.mainContainer}>
      <WIP isReady={!shidurWIP && !cleanWIP}>
        <View>
          {isPlay ? (
            <View>
              {isOnAir && (
                <Text style={[baseStyles.text, styles.onAir]}>
                  {t('shidur.onAir')}
                </Text>
              )}
              {video !== NO_VIDEO_OPTION_VALUE && url ? (
                <MemoizedRTCView streamURL={url} />
              ) : (
                <View style={styles.noVideo}>
                  <Icon name="graphic-eq" color="white" size={70} />
                </View>
              )}
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
                <OriginalSwitch />
              </View>

              <View style={styles.toolbarBtnsGroup}>
                <SubtitleBtn />
                <OptionsBtn />
                <FullscreenBtn />
              </View>
            </View>
          )}
        </View>
      </WIP>
    </View>
  );
};

// Memoized RTCView component
const MemoizedRTCView = memo(
  ({ streamURL }) => {
    logger.debug(NAMESPACE, `MemoizedRTCView render`, streamURL);
    return (
      <RTCView
        streamURL={streamURL}
        style={styles.viewer}
        objectFit="contain"
      />
    );
  },
  (prevProps, nextProps) => {
    return prevProps.streamURL === nextProps.streamURL;
  }
);

const styles = StyleSheet.create({
  mainContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
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

export default withProfiler(Shidur, { name: 'Shidur' });
