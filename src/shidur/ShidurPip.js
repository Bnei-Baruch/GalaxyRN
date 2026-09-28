import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../components/CustomText';
import WIP from '../components/WIP';
import { baseStyles } from '../constants';
import { NO_VIDEO_OPTION_VALUE } from '../consts';
import { useSettingsStore } from '../zustand/settings';
import { useShidurStore } from '../zustand/shidur';
import { PlayPauseOverlay } from './PlayPauseOverlay';
import ShidurMemoized from './ShidurMemoized';
import { styles } from './styles';

const PipShidur = () => {
  const { url, isPlay, video, isOnAir, shidurWIP, cleanWIP } =
    useShidurStore();
  const netWIP = useSettingsStore(state => state.netWIP);
  const { t } = useTranslation();

  return (
    <View style={[pipStyles.mainContainer, { backgroundColor: 'black' }]}>
      <WIP isReady={!shidurWIP && !cleanWIP && !netWIP}>
        <View style={pipStyles.viewer}>
          {isPlay ? (
            <View style={pipStyles.viewer}>
              {isOnAir && (
                <Text style={[baseStyles.text, styles.onAir]}>
                  {t('shidur.onAir')}
                </Text>
              )}
              {video !== NO_VIDEO_OPTION_VALUE && url ? (
                <ShidurMemoized streamURL={url} style={pipStyles.video} />
              ) : (
                <View style={pipStyles.viewer}>
                  <Icon name="graphic-eq" color="white" size={70} />
                </View>
              )}
            </View>
          ) : (
            <PlayPauseOverlay />
          )}
        </View>
      </WIP>
    </View>
  );
};

const pipStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  viewer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
export default PipShidur;
