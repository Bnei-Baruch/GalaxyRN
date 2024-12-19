import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import kc from '../auth/keycloak';
import { useUserStore } from '../zustand/user';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from './helper';

const LogoutBtn = () => {
  const { setUser }  = useUserStore();
  const handleLogout = () => {
    kc.Logout(() => {
      setUser(null);
    });
  };
  return (
    <TouchableOpacity onPress={handleLogout} style={topMenuBtns.btn}>
      <Icon name="logout" size={30} color="white" />
      <Text style={topMenuBtns.menuItemText}>{'topBar.logout'}</Text>
    </TouchableOpacity>
  );
};

export default LogoutBtn;

