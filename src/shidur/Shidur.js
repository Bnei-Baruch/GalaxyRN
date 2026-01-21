import React, { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RTCView } from 'react-native-webrtc';
import Text from '../components/CustomText';
import WIP from '../components/WIP';
import { SHIDUR_BAR_ZINDEX, baseStyles } from '../constants';
import { NO_VIDEO_OPTION_VALUE } from '../consts';
import { withProfiler } from '../libs/sentry/sentryHOC';
import logger from '../services/logger';
import { useSettingsStore } from '../zustand/settings';
import { useShidurStore } from '../zustand/shidur';
import { useSubtitleStore } from '../zustand/subtitle';
import { useUiActions } from '../zustand/uiActions';
import { FullscreenBtn } from './FullscreenBtn';
import { PlayPauseBtn } from './PlayPauseBtn';
import { PlayPauseOverlay } from './PlayPauseOverlay';
import Subtitle from './Subtitle';

const NAMESPACE = 'Shidur';

const Shidur = () => {
  const { url, isPlay, video, isOnAir, audio, shidurWIP, cleanWIP } =
    useShidurStore();
  const audioKey = audio?.key;
  const { init: initSubtitle, exit: exitSubtitle } = useSubtitleStore();
  const { showBars } = useUiActions();
  const netWIP = useSettingsStore(state => state.netWIP);
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
      <WIP isReady={!shidurWIP && !cleanWIP && !netWIP}>
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
            </View>
          ) : (
            <PlayPauseOverlay />
          )}

          {showBars && (
            <View style={styles.toolbar}>
              <View style={styles.toolbarBtnsGroup}>
                <PlayPauseBtn />
              </View>

              <View style={styles.toolbarBtnsGroup}>
                <FullscreenBtn />
              </View>
            </View>
          )}

          <Subtitle />
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
