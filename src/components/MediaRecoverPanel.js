import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from './CustomText';

const MediaRecoverPanel = ({
  onRetry,
  messageKey = 'connection.mediaRecoverMessage',
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Icon name="refresh" size={40} color="#fafafa" />
        </View>
        <Text style={styles.message}>{t(messageKey)}</Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onRetry}
        >
          <Text style={styles.buttonText}>{t('errorBoundary.tryAgain')}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  card: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#404040',
  },
  message: {
    color: '#d4d4d4',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 28,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MediaRecoverPanel;
