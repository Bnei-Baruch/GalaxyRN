import React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import kc from '../auth/keycloak';
import Text from '../components/CustomText';
import { topMenuBtns } from './helper';

const LogoutBtn = () => {
  const { t } = useTranslation();

  const handleLogout = () => {
    kc.logout();
  };
  return (
    <TouchableOpacity onPress={handleLogout} style={topMenuBtns.btn}>
      <Icon name="logout" size={30} color="white" />
      <Text style={topMenuBtns.menuItemText}>{t('user.logout')}</Text>
    </TouchableOpacity>
  );
};

export default LogoutBtn;
