import React, { useEffect } from 'react';
import { Button, Dimensions, StyleSheet, SafeAreaView, } from 'react-native';
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
      <SafeAreaView>
        {children}
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Login" onPress={handleLogin} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  selfView  : {
    width : 200,
    height: 150,
  },
  remoteView: {
    width : Dimensions.get('window').width,
    height: Dimensions.get('window').height / 2.35,
  },
  container : {
    flex           : 1,
    justifyContent : 'center',
    backgroundColor: '#fff',
    padding        : 20,
    margin         : 10,
  },
  top       : {
    flex                : 0.3,
    backgroundColor     : 'grey',
    borderWidth         : 5,
    borderTopLeftRadius : 20,
    borderTopRightRadius: 20,
  },
  middle    : {
    flex           : 0.3,
    backgroundColor: 'beige',
    borderWidth    : 5,
  },
  bottom    : {
    flex                   : 0.3,
    backgroundColor        : 'pink',
    borderWidth            : 5,
    borderBottomLeftRadius : 20,
    borderBottomRightRadius: 20,
  },
});

export default LoginPage;
