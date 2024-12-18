import React, { useEffect } from 'react';
import { Button, StyleSheet, View, } from 'react-native';
import kc from './keycloak';
import { useUserStore } from '../zustand/user';
import { getUserRole } from '../shared/enums';
import { useTranslation } from 'react-i18next';

const LoginPage = ({ children }) => {
  const { user, setUser } = useUserStore();
  const { t }             = useTranslation();

  useEffect(() => {
    kc.getUser(u => {
      if (!u) return;
      const role = getUserRole(u.roles);
      setUser({ ...u, role });
    });
  }, []);

  if (user)
    return (
      <View style={styles.container}>
        {children}
      </View>
    );

  const handleLogin = () => {
    kc.Login(() => {
      kc.getUser(u => {
        if (!u) return;
        const role = getUserRole(u.roles);
        setUser({ ...u, role });
      });
    });
  };

  return (
    <View style={[styles.container, styles.login]}>
      <Button title={t('loginPage.login')} onPress={handleLogin} />
    </View>
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
