import React from 'react';
import { TouchableOpacity } from 'react-native';
import kc from '../auth/keycloak';
import { useUserStore } from '../zustand/user';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LogoutBtn = () => {
  const { setUser }  = useUserStore();
  const handleLogout = () => {
    kc.Logout(() => {
      setUser(null);
    });
  };
  return (
    <TouchableOpacity onPress={handleLogout}>
      <Icon name="logout" size={30} color="black" />
    </TouchableOpacity>
  );
};

export default LogoutBtn;

