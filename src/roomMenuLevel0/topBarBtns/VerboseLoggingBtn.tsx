import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { sendLogsWithFeedback } from '../../services/sendLogsWithFeedback';
import { useUserStore } from '../../zustand/user';
import { useVerboseLoggingStore } from '../../zustand/verboseLogging';

export const VerboseLoggingBtn = () => {
  const isVerboseLogging = useVerboseLoggingStore(state => !!state.until);
  const email = useUserStore(state => state.user?.email);
  const { t } = useTranslation();

  if (!isVerboseLogging) return null;

  // Small icon next to the leave button — confirm to avoid accidental sends
  const handleSendLogs = () =>
    Alert.alert(t('moreOpts.sendLogs'), t('logs.sendConfirm'), [
      { text: t('user.cancel'), style: 'cancel' },
      { text: t('logs.send'), onPress: () => sendLogsWithFeedback(email, t) },
    ]);

  return (
    <TouchableOpacity
      onPress={handleSendLogs}
      hitSlop={8}
      testID="verboseLoggingIndicator"
    >
      <Icon name="bug-report" size={22} color="#FFA000" />
    </TouchableOpacity>
  );
};
