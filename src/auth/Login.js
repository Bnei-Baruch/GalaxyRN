import React, { useEffect } from 'react';
import { Button, StyleSheet, SafeAreaView, } from 'react-native';
import kc from './keycloak';
import { useUserStore } from '../zustand/user';
import { getUserRole } from '../shared/enums';

const LoginPage = ({ children }) => {
  const { user, setUser } = useUserStore();

  useEffect(() => {
    kc.getUser(u => {
      if (!u) return;
      const role = getUserRole(u.roles);
      setUser({ ...u, role });
    });
  }, []);

  const handleLogin = () => {
    kc.Login(() => {
      kc.getUser(u => {
        if (!u) return;
        const role = getUserRole(u.roles);
        setUser({ ...u, role });
      });
    });
  };

  if (user)
    return (
      <SafeAreaView style={styles.container}>
        {children}
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.container, styles.login]}>
      <Button title="Login" onPress={handleLogin} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: '#fff',
  },
  login    : {
    justifyContent: 'center',
  }
});

export default LoginPage;
