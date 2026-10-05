import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { baseStyles } from '../constants';
import { sendLogsWithFeedback } from '../services/sendLogsWithFeedback';
import { useUserStore } from '../zustand/user';
import { useVersionStore } from '../zustand/version';
import { useVerboseLoggingStore } from '../zustand/verboseLogging';
import Text from './CustomText';

// Hidden toggle for full logging: this many taps on the version,
// each within TAP_WINDOW_MS of the previous one
const TAPS_TO_TOGGLE = 7;
const TAP_WINDOW_MS = 1500;

const formatTime = until =>
  new Date(until).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const VersionInfo = () => {
  const { t } = useTranslation();
  const { currentVersion, latestVersion, updateAvailable, openAppStore } =
    useVersionStore();
  const { until, enable, disable } = useVerboseLoggingStore();
  const email = useUserStore(state => state.user?.email);
  const taps = useRef({ count: 0, last: 0 });

  const handleVersionPress = () => {
    const now = Date.now();
    const tapState = taps.current;
    tapState.count =
      now - tapState.last < TAP_WINDOW_MS ? tapState.count + 1 : 1;
    tapState.last = now;
    if (tapState.count < TAPS_TO_TOGGLE) return;

    tapState.count = 0;
    if (until) {
      Alert.alert(t('logs.verboseTitle'), t('logs.disableVerboseMessage'), [
        { text: t('user.cancel'), style: 'cancel' },
        { text: t('logs.disable'), onPress: disable },
      ]);
    } else {
      Alert.alert(t('logs.verboseTitle'), t('logs.enableVerboseMessage'), [
        { text: t('user.cancel'), style: 'cancel' },
        { text: t('logs.enable'), onPress: enable },
      ]);
    }
  };

  return (
    <View style={[styles.container]}>
      <View style={styles.textContainer}>
        <Pressable onPress={handleVersionPress} testID="versionInfo">
          <Text style={[baseStyles.text, styles.text]}>
            {t('update.currentVersion')}: {currentVersion}
          </Text>
        </Pressable>
        {!!until && (
          <>
            <Text style={[baseStyles.text, styles.text, styles.verbose]}>
              {t('logs.verboseUntil', { time: formatTime(until) })}
            </Text>
            <TouchableOpacity
              onPress={() => sendLogsWithFeedback(email, t)}
              style={styles.sendLogs}
              testID="sendLogsBtn"
            >
              <Icon name="send" size={16} color="#FFA000" />
              <Text style={[baseStyles.text, styles.text, styles.verbose]}>
                {t('moreOpts.sendLogs')}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {updateAvailable && (
          <Text style={[baseStyles.text, styles.text]}>
            {t('update.latestVersion')}: {latestVersion}
          </Text>
        )}
      </View>

      {updateAvailable && (
        <TouchableOpacity onPress={openAppStore} style={styles.button}>
          <Text style={baseStyles.text}>{t('update.updateNow')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  textContainer: {
    justifyContent: 'space-between',
  },
  text: {
    fontSize: 12,
  },
  verbose: {
    color: '#FFA000',
  },
  sendLogs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  button: {
    borderRadius: 5,
    backgroundColor: '#03A9F4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
    lineHeight: 40,
  },
});

export default VersionInfo;
