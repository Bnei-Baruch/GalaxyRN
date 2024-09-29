import React from 'react';
import { Button, View } from 'react-native';
import kc from './keycloak';
import { useUserStore } from '../zustand/user';

const Logout = () => {

  const { user, setUser } = useUserStore();
  const handleLogout      = () => {
    kc.Logout(() => {
      setUser(null);
    });
  };
  return (
    <View>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default Logout;

