import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import logger from '../services/logger';

import WIP from '../components/WIP';
import UserPermissions from '../services/UserPermissions';
import { useUserStore } from '../zustand/user';
import kc from './keycloak';

const NAMESPACE = 'CheckAuthentication';

const CheckAuthentication = ({ children }) => {
  const { user, wip, vhinfo } = useUserStore();
  const { t } = useTranslation();

  useEffect(() => {
    kc.startFromStorage();
    return () => kc.clearTimeout();
  }, []);

  const handleLogin = () => {
    logger.debug(NAMESPACE, 'Membership validation: login');
    kc.login();
  };

  if (!user) {
    return (
      <WIP isReady={!wip}>
        <View style={[styles.loginContainer, styles.container]}>
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginTxt}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
      </WIP>
    );
  }

  if (!vhinfo) {
    return <WIP isReady={true}></WIP>;
  }

  if (!vhinfo.active) {
    return <UserPermissions />;
  }

  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loginContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtn: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginTxt: {
    color: 'white',
    fontSize: 30,
  },
});

export default CheckAuthentication;
