import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import Text from './CustomText';
import { baseStyles } from '../constants';
import logger from '../services/logger';
import { useMyStreamStore } from '../zustand/myStream';
import { useSettingsStore } from '../zustand/settings';
import MyRTCView from './MyRTCView';

const MyVideo = ({ styles }) => {
  const { t } = useTranslation();
  const { cammute } = useMyStreamStore();
  const isTen = useSettingsStore(state => state.isTen);
  const { width, height } = Dimensions.get('window');
  const iconSize = Math.min(width, height) * 0.25; // 25% of the smallest screen dimension

  logger.debug('MyVideo', 'render', cammute);
  return (
    <View style={styles}>
      {!isTen ? (
        <View style={[baseStyles.videoOverlay, localStyles.noTen]}>
          <Icon name="desktop-windows" size={iconSize * 0.6} color="white" />
          <Text style={[baseStyles.text, localStyles.noTenText]}>
            {t('settings.broadcastOnly')}
          </Text>
        </View>
      ) : cammute ? (
        <View style={baseStyles.videoOverlay}>
          <Icon name="account-circle" size={iconSize} color="white" />
        </View>
      ) : (
        <MyRTCView />
      )}
    </View>
  );
};
export default MyVideo;

const localStyles = StyleSheet.create({
  noTen: {
    paddingHorizontal: 24,
  },
  noTenText: {
    marginTop: 12,
    fontSize: 15,
    textAlign: 'center',
  },
});
