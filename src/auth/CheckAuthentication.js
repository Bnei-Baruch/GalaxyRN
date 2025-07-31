import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import logo from '../../android/app/src/main/res/mipmap-xxxhdpi/arvut.png'; // eslint-disable-line
import WIP from '../components/WIP';
import logger from '../services/logger';
import UserPermissions from '../services/UserPermissions';
import SelectUiLanguage from '../settings/SelectUiLanguage';
import { useUserStore } from '../zustand/user';
import kc from './keycloak';
import TermsOfUseModal from './TermsOfUseModal';

const NAMESPACE = 'CheckAuthentication';

const CheckAuthentication = ({ children }) => {
  const { user, wip, vhinfo } = useUserStore();
  const { t } = useTranslation();
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);

  useEffect(() => {
    kc.startFromStorage();
    return () => kc.clearTimeout();
  }, []);

  const handleLogin = () => {
    logger.debug(NAMESPACE, 'Membership validation: login');
    kc.login();
  };

  const handleTermsPress = () => {
    setIsTermsModalVisible(true);
  };

  logger.debug(NAMESPACE, 'render user: ', !!user);
  if (!user) {
    return (
      <WIP isReady={!wip}>
        <View style={[styles.container]}>
          {/* Header with logo and app name */}
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} />
            <SelectUiLanguage />
          </View>

          {/* Main content */}
          <View style={styles.mainContent}>
            <Text style={styles.appTitle}>{t('loginPage.appTitle')}</Text>
            <Text style={styles.slogan}>{t('loginPage.slogan')}</Text>
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginTxt}>{t('login')}</Text>
            </TouchableOpacity>
          </View>

          {/* Terms of use */}
          <View style={styles.termsContainer}>
            <TouchableOpacity onPress={handleTermsPress}>
              <Text style={styles.termsText}>{t('loginPage.termsOfUse')}</Text>
            </TouchableOpacity>
          </View>

          <TermsOfUseModal
            visible={isTermsModalVisible}
            onClose={() => setIsTermsModalVisible(false)}
          />
        </View>
      </WIP>
    );
  }
  logger.debug(NAMESPACE, 'render vhinfo: ', !!vhinfo);
  if (!vhinfo) {
    return <WIP isReady={true}></WIP>;
  }
  logger.debug(NAMESPACE, 'render vhinfo.active: ', vhinfo.active);
  if (!vhinfo.active) {
    return <UserPermissions />;
  }
  logger.debug(NAMESPACE, 'render children');
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 10,
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 10,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  slogan: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 60,
  },
  loginBtn: {
    width: 200,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginTxt: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  termsContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  termsText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default CheckAuthentication;
