import React, { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RTCView } from 'react-native-webrtc';
import MediaRecoverPanel from '../components/MediaRecoverPanel';
import Text from '../components/CustomText';
import WIP from '../components/WIP';
import { baseStyles } from '../constants';
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
import commonStyles from './style';
import { styles } from './styles';


const NAMESPACE = 'Shidur';

const Shidur = () => {
  const {
    url,
    isPlay,
    video,
    isOnAir,
    audio,
    shidurWIP,
    cleanWIP,
    withRestart,
    retryShidurAfterWait,
  } = useShidurStore();
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

  if (withRestart) {
    return (
      <View style={[styles.mainContainer, styles.restartScreen]}>
        <MediaRecoverPanel onRetry={() => void retryShidurAfterWait()} />
      </View>
    );
  }

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
            <View style={commonStyles.toolbar}>
              <View style={commonStyles.toolbarBtnsGroup}>
                <PlayPauseBtn />
              </View>

              <View style={commonStyles.toolbarBtnsGroup}>
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
        iosPIP={{
          enabled: true,
          stopAutomatically: false,
          preferredSize: {
            width: 100,
            height: 100,
          },
        }}
      />
    );
  },
  (prevProps, nextProps) => {
    return prevProps.streamURL === nextProps.streamURL;
  }
);

export default withProfiler(Shidur, { name: 'Shidur' });
