import mqtt from '../shared/mqtt';
import { authorize, logout, refresh } from 'react-native-app-auth';
import RNSecureStorage from 'rn-secure-storage';
import { decode } from 'base-64';
import log from 'loglevel';
import api from '../shared/Api';
import { getUserRole, userRolesEnum } from '../shared/enums';
import { useUserStore } from '../zustand/user';
import { getFromStorage, setToStorage } from '../shared/tools';
import BackgroundTimer from 'react-native-background-timer';
import { sendSentry } from '../sentryHelper';

const authConfig = {
  issuer     : 'https://accounts.kab.info/auth/realms/main',
  clientId   : 'galaxy',
  redirectUrl: 'com.galaxy://callback',
  scopes     : ['openid', 'profile'],
};

const decodeJWTPayload = (token) =>
  token ? JSON.parse(decode(token.split('.')[1])) : {};

const decodeJWTHeader = (token) =>
  token ? JSON.parse(decode(token.split('.')[0])) : {};

class Keycloak {
  constructor() {
    this.user    = null;
    this.session = null;
    this.token   = null;
    this.ival    = null;
    this.timeout = 0;
  }

  login = () => {
    useUserStore.getState().setWIP(true);
    authorize(authConfig).then(data => {
      log.debug('kcLogin: ', data);
      this.setSession(data);
      return this.fetchUser();
    }).catch(err => {
      log.error(err);
      this.logout();
    });
  };

  logout = () => {
    if (this.ival) clearInterval(this.ival);
    logout(authConfig, {
      idToken              : this.session.idToken,
      postLogoutRedirectUrl: 'com.galaxy://callback',
    }).then(res => {
      log.debug('kcLogout: ', res);
      this.session = null;
      RNSecureStorage
        .removeItem('user_session')
        .then(() => useUserStore.getState().setUser(null));
    }).catch(err => {
      log.error(err);
    });
  };

  setSession = (data) => {
    const { accessToken, refreshToken, idToken } = data;
    const session                                = {
      accessToken : accessToken,
      refreshToken: refreshToken,
      idToken     : idToken,
      payload     : decodeJWTPayload(accessToken),
      header      : decodeJWTHeader(accessToken),
    };

    this.session = session;
    mqtt.setToken(session.accessToken);
    api.setAccessToken(session.accessToken);
    setToStorage('user_session', JSON.stringify(session));
    this.saveUser(this.session.payload);
  };

  refreshToken = async () => {
    sendSentry(`start refreshToken is this.session: ${!!this.session}`);
    if (!this.session) return;

    const timeToRefresh = (new Date(this.session.payload.exp * 1000) - new Date) / 2;
    sendSentry(`start refreshToken timeToRefresh: ${timeToRefresh}`);
    this.clearTimout();
    if (timeToRefresh + 1000 > 0) {
      this.timeout = BackgroundTimer.setTimeout(() => {
        sendSentry('check keycloak: refresh token time');
        this.refreshToken();
      }, timeToRefresh);
      return;
    }

    try {
      const data = await refresh(authConfig, { refreshToken: this.session.refreshToken });
      log.debug('Refresh Token: ', data);
      this.setSession(data);
      return this.refreshToken();
    } catch (err) {
      log.error('Refresh Token: ', err);
      this.logout();
    }
  };

  fetchUser = async () => {
    useUserStore.getState().setWIP(true);
    const data = await getFromStorage('user_session', null);
    sendSentry(`fetchUser getFromStorage is data: ${!!data}`);
    console.log('fetchUser getFromStorage: ', data);
    if (!data)
      return useUserStore.getState().setUser(null);

    this.session        = JSON.parse(data);
    const token_expired = new Date(this.session.payload.exp * 1000) - new Date < 0;

    if (token_expired) {
      sendSentry(`fetchUser token_expired: ${token_expired}`);
      await this.refreshToken();
      return;
    }

    this.setSession(this.session);
  };

  saveUser = async (token) => {
    const { realm_access: { roles }, sub, given_name, name, email, family_name, } = token;

    const role    = getUserRole(roles);
    const allowed = await this.checkPermission(role);

    const user = {
      id        : sub,
      display   : name,
      username  : given_name,
      familyname: family_name,
      isClient  : true,
      role,
      email,
      roles,
      allowed,
    };
    useUserStore.getState().setUser(user);
  };

  checkPermission = async (role) => {
    if (!role)
      return this.logout();
    let vhinfo;
    try {
      vhinfo = await api.fetchVHInfo();
    } catch (err) {
      console.error('Error fetching VH info data: ', err?.message);
      vhinfo = { active: false, error: err?.message };
    }
    useUserStore.getState().setVhinfo(vhinfo);
    return !!vhinfo.active && role === userRolesEnum.user;
  };

  clearTimout = () => this.timeout && BackgroundTimer.clearTimeout(this.timeout);
}

const defaultKeycloak = new Keycloak();

export default defaultKeycloak;

