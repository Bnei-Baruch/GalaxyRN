import React, { useEffect } from 'react';
import { Button, Dimensions, StyleSheet, View, } from 'react-native';
import kc from './keycloak';
import { useUserStore } from '../zustand/user';
import Logout from './Logout';

const LoginPage = ({ children }) => {
  const { user, setUser } = useUserStore();

  useEffect(() => {
    kc.getUser(setUser);
  }, []);

  const handleLogin = () => {
    console.log('Login');
    kc.Login(() => {
      kc.getUser(setUser); // Directly update state after login
    });
  };

  if (user)
    return (
      <>
        <Logout />
        {children}
      </>
    );

  return (
    <View>
      <Button title="Login" onPress={handleLogin} />
    </View>
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