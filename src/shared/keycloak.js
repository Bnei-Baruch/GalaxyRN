import mqtt from './mqtt'
import { authorize, logout, refresh } from 'react-native-app-auth'
import RNSecureStorage, { ACCESSIBLE } from 'rn-secure-storage'
import { decode } from 'base-64'
import log from 'loglevel'

const authConfig = {
  issuer: 'https://accounts.kab.info/auth/realms/main',
  clientId: 'galaxy',
  redirectUrl: 'com.galaxy://callback',
  scopes: ['openid', 'profile'],
}

const decodeJWTPayload = (token) =>
  token ? JSON.parse(decode(token.split('.')[1])) : {}

const decodeJWTHeader = (token) =>
  token ? JSON.parse(decode(token.split('.')[0])) : {}

class Keycloak {
  constructor () {
    this.user = null
    this.session = null
    this.token = null
    this.ival = null
  }

  Login = (callback) => {
    authorize(authConfig).then(data => {
      log.debug('kcLogin: ', data)
      this.setSession(data)
      callback(true)
    }).catch(err => {
      log.error(err)
      callback(null)
    })
  }

  setSession = (data) => {
    const { accessToken, refreshToken, idToken } = data
    const session = {
      accessToken: accessToken,
      refreshToken: refreshToken,
      idToken: idToken,
      payload: decodeJWTPayload(accessToken),
      header: decodeJWTHeader(accessToken),
    }
    this.session = session
    mqtt.setToken(session.accessToken)
    RNSecureStorage.setItem('user_session', JSON.stringify(session),
      { accessible: ACCESSIBLE.WHEN_UNLOCKED })
  }

  Logout = (callback) => {
    if (this.ival) clearInterval(this.ival)
    logout(authConfig, {
      idToken: this.session.idToken,
      postLogoutRedirectUrl: 'com.galaxy://callback',
    }).then(res => {
      log.debug('kcLogout: ', res)
      this.session = null
      RNSecureStorage.removeItem('user_session').then(() => {
        callback(true)
      })
    }).catch(err => {
      log.error(err)
    })
  }

  getSession = () => {
    RNSecureStorage.getItem('user_session').then(s => {
      this.session = s ? JSON.parse(s) : null
    }).catch(err => log.error('getSession: ', err))
  }

  refreshToken = (session, callback) => {
    refresh(authConfig, { refreshToken: session.refreshToken }).then(data => {
      log.debug('Refresh Token: ', data)
      this.setSession(data)
      const user = this.setUser(this.session.payload)
      if (typeof callback === 'function') callback(user)
    }).catch(err => {
      log.error('Refresh Token: ', err)
      if (typeof callback === 'function') callback(null)
    })
  }

  tokenMonitor = () => {
    if (this.ival) return
    this.ival = setInterval(() => {
      const { payload } = this.session
      if (payload) {
        log.debug('_tokenMonitor: time: ',
          new Date(payload.exp * 1000) - new Date)
        const token_expired = new Date(payload.exp * 1000) - new Date < 0
        if (token_expired) {
          log.debug('_tokenMonitor: token expired: ', token_expired)
          this.refreshToken(this.session)
        }
      }
    }, 10000)
  }

  getUser = (callback) => {
    RNSecureStorage.getItem('user_session').then(data => {
      if (data) {
        const session = JSON.parse(data)
        this.session = session
        const user = this.setUser(session.payload)
        const token_expired = new Date(session.payload.exp * 1000) - new Date <
          0
        if (token_expired) {
          log.debug('GetUser: token expired: ', token_expired)
          this.refreshToken(session, callback)
        } else {
          //this.tokenMonitor();
          mqtt.setToken(session.accessToken)
          callback(user)
        }
      } else {
        callback(null)
      }
    }).catch(err => {
      log.error('getSession: ', err)
      callback(null)
    })
  }

  setUser = (token) => {
    const {
      realm_access: { roles },
      sub,
      given_name,
      name,
      email,
      family_name,
    } = token
    const user = {
      display: name,
      email,
      roles,
      id: sub,
      username: given_name,
      familyname: family_name,
    }
    return user
  }

}

const defaultKeycloak = new Keycloak()

export default defaultKeycloak

