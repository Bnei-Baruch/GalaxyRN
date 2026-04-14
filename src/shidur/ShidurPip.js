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


const PipShidur = () => {
  const { url, isPlay, video, isOnAir, shidurWIP, cleanWIP } =
    useShidurStore();
  const netWIP = useSettingsStore(state => state.netWIP);
  const { t } = useTranslation();

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
                <ShidurMemoized streamURL={url} />
              ) : (
                <View style={styles.noVideo}>
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


export default PipShidur;
