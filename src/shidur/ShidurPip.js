import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
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
import { StyleSheet } from 'react-native';



const PipShidur = () => {
  const { url, isPlay, video, isOnAir, shidurWIP, cleanWIP } =
    useShidurStore();
  const netWIP = useSettingsStore(state => state.netWIP);
  const { t } = useTranslation();

  return (
    <View style={[pipStyles.mainContainer, { backgroundColor: 'black' }]}>
      <WIP isReady={!shidurWIP && !cleanWIP && !netWIP}>
        <View style={[styles.viewer, { aspectRatio: 1 }]}>
          {isPlay ? (
            <View>
              {isOnAir && (
                <Text style={[baseStyles.text, styles.onAir]}>
                  {t('shidur.onAir')}
                </Text>
              )}
              {video !== NO_VIDEO_OPTION_VALUE && url ? (
                <ShidurMemoized streamURL={url} />
              ) : (
                <View style={[styles.noVideo]}>
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
    aspectRatio: 1,
  },
  viewer: {
    aspectRatio: 1,
  }
});
export default PipShidur;
