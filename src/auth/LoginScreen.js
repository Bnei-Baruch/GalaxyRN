import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import logo from '../assets/arvut.png';
import NetConnectionModal from '../components/ConnectionStatus/NetConnectionModal';
import Text from '../components/CustomText';
import WIP from '../components/WIP';
import logger from '../services/logger';
import SelectUiLanguage from '../settings/SelectUiLanguage';
import { useUserStore } from '../zustand/user';
import TermsOfUseModal from './TermsOfUseModal';
import kc from './keycloak';

const NAMESPACE = 'LoginScreen';

const LoginScreen = () => {
  const { t } = useTranslation();
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);

  const wip = useUserStore(state => state.wip);
  if (wip) {
    return <WIP isReady={false} />;
  }

  const handleTermsPress = () => {
    setIsTermsModalVisible(true);
  };

  const handleLogin = () => {
    logger.debug(NAMESPACE, 'Membership validation: login');
    kc.login();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} />
        <SelectUiLanguage />
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.appTitle}>{t('loginPage.appTitle')}</Text>
        <Text style={styles.slogan}>{t('loginPage.slogan')}</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginTxt}>{t('login')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.termsContainer}>
        <TouchableOpacity onPress={handleTermsPress}>
          <Text style={styles.termsText}>{t('loginPage.termsOfUse')}</Text>
        </TouchableOpacity>
      </View>

      <TermsOfUseModal
        visible={isTermsModalVisible}
        onClose={() => setIsTermsModalVisible(false)}
      />
      <NetConnectionModal />
    </View>
  );
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

export default LoginScreen;
