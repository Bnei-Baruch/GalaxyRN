import React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AccountSettings from '../auth/AccountSettings';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import { useUserStore } from '../zustand/user';

const UserPermissions = () => {
  const { t } = useTranslation();
  const { vhinfo } = useUserStore();
  const insets = useSafeAreaInsets();

  const handleContactSupport = () => {
    Linking.openURL('mailto:help@kli.one');
  };

  return (
    <View
      style={[
        baseStyles.full,
        baseStyles.viewBackground,
        { paddingTop: insets.top },
      ]}
    >
      <View style={styles.top}>
        <AccountSettings withTitle={false} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('permissions.title')}</Text>
        <Text style={styles.text}>{t('permissions.contactMessage')}</Text>
        <TouchableOpacity style={styles.sendBtn} onPress={handleContactSupport}>
          <Text style={styles.sendText}>{t('permissions.sendButton')}</Text>
        </TouchableOpacity>
        {vhinfo.error && <Text>{vhinfo?.error?.message}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  top: {
    alignItems: 'center',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
  },
  text: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
  },
  sendBtn: {
    backgroundColor: '#4b7bec',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  sendText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UserPermissions;
