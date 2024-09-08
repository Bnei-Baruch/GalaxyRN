import React, { useEffect, useState } from 'react'
import {
  Button,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native'
import kc from './keycloak'
import { useUserStore } from '../zustand/user'

const LoginPage = ({ children }) => {
  const [disabled, setDisabled] = useState(false)
  const { setName, setToken, username, setUser } = useUserStore()

  useEffect(() => {
    const appLogin = () => {
      kc.getUser((user) => {
        if (user) {
          setName(user.username)
          setUser(user)
          setToken(kc.session.accessToken)
        } else {
          setDisabled(false)
        }
      })
    }

    appLogin()
  }, [])

  /* useEffect(() => {
     // Update loading state from props
     if (user) {
       //setDisabled(loading)
     }
   }, [loading, user])*/

  const handleLogin = () => {
    setDisabled(true)
    kc.Login(() => {
      kc.getUser(setUser) // Directly update state after login
    })
  }

  const handleLogout = () => {
    setDisabled(true)
    kc.Logout(() => {
      setUser(null)
    })
  }

  if (username)
    return children

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}/>
      <View style={styles.middle}>
        <Button disabled={disabled} title="Login" onPress={handleLogin}/>
      </View>
      <View style={styles.bottom}/>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  selfView: {
    width: 200,
    height: 150,
  },
  remoteView: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height / 2.35,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 20,
    margin: 10,
  },
  top: {
    flex: 0.3,
    backgroundColor: 'grey',
    borderWidth: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  middle: {
    flex: 0.3,
    backgroundColor: 'beige',
    borderWidth: 5,
  },
  bottom: {
    flex: 0.3,
    backgroundColor: 'pink',
    borderWidth: 5,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
})

export default LoginPage