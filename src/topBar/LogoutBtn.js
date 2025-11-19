import React from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import kc from '../auth/keycloak';
import Text from '../components/CustomText';
import logger from '../services/logger';
import { useInRoomStore } from '../zustand/inRoom';
import { topMenuBtns } from './helper';

const NAMESPACE = 'LogoutBtn';

const LogoutBtn = () => {
  const { t } = useTranslation();

  const handleLogout = async () => {
    logger.debug(NAMESPACE, 'handleLogout');
    try {
      await useInRoomStore.getState().exitRoom();
    } catch (error) {
      logger.error(NAMESPACE, 'Error exiting room', error);
    }
    try {
      await kc.logout();
    } catch (error) {
      logger.error(NAMESPACE, 'Error logging out', error);
    }
  };
  return (
    <TouchableOpacity onPress={handleLogout} style={topMenuBtns.btn}>
      <Icon name="logout" size={30} color="white" />
      <Text style={topMenuBtns.menuItemText}>{t('user.logout')}</Text>
    </TouchableOpacity>
  );
};

export default LogoutBtn;
