import { AUTH_CONFIG_ISSUER } from '@env';
import { decode } from 'base-64';
import { authorize, logout, refresh } from 'react-native-app-auth';
import BackgroundTimer from 'react-native-background-timer';
import RNSecureStorage from 'rn-secure-storage';
import { getUserRole, userRolesEnum } from '../enums';
import mqtt from '../libs/mqtt';
import {
  addBreadcrumb,
  clearUser as clearSentryUser,
  setUser as setSentryUser,
} from '../libs/sentry/sentryHelper';
import api from '../services/Api';
import logger from '../services/logger';
import { fixTextEncoding, getFromStorage, setToStorage } from '../tools';
import { useUserStore } from '../zustand/user';

const NAMESPACE = 'Keycloak';

// Configuration
const AUTH_CONFIG = {
  issuer: AUTH_CONFIG_ISSUER,
  clientId: 'galaxy',
  redirectUrl: 'com.galaxy://callback',
  scopes: ['openid', 'profile'],
  postLogoutRedirectUrl: 'com.galaxy://callback',
  iosPrefersEphemeralSession: false,
};

const base64UrlDecode = str => {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  const pad = base64.length % 4;
  const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;

  return decode(paddedBase64);
};

const isBase64Url = str => {
  const base64UrlRegex = /^[A-Za-z0-9_-]*={0,2}$/;
  return base64UrlRegex.test(str);
};

const decodeJWT = token => {
  if (!token) return {};

  try {
    let decoded;
    logger.debug(NAMESPACE, 'Checking token encoding format');
    if (isBase64Url(token)) {
      logger.debug(NAMESPACE, 'Token is in base64url format');
      decoded = base64UrlDecode(token);
    } else {
      logger.debug(NAMESPACE, 'Using default base64 decoding');
      decoded = decode(token);
    }
    return JSON.parse(decoded);
  } catch (err) {
    logger.error(NAMESPACE, 'Error decoding JWT', err);
    return {};
  }
};

class Keycloak {
  constructor() {
    this.session = null;
    this.timeout = 0;
  }

  /**
   * Initiates the login process
   */
  login = async () => {
    useUserStore.getState().setWIP(true);

    await authorize(AUTH_CONFIG)
      .then(authData => {
        const session = this.setSession(authData);

        if (!session) {
          return this.logout();
        }

        return this.fetchUser(session);
      })
      .catch(err => {
        logger.error(NAMESPACE, 'Login failed', err);
        this.logout();
      });
  };

  /**
   * Logs the user out and cleans up resources
   */
  logout = async () => {
    this.clearTimeout();

    addBreadcrumb('auth', 'User logging out');
    // Clear the user from Sentry tracking
    clearSentryUser();

    if (this.session) {
      try {
        await logout(AUTH_CONFIG, {
          idToken: this.session.idToken,
          postLogoutRedirectUrl: AUTH_CONFIG.postLogoutRedirectUrl,
        });
      } catch (err) {
        logger.error(NAMESPACE, 'Logout error', err);
      }
    }

    this.session = null;

    try {
      await RNSecureStorage.removeItem('user_session');
    } catch (err) {
      logger.debug(
        NAMESPACE,
        'Failed to remove user_session from secure storage',
        err
      );
    }

    useUserStore.getState().setUser(null);
    useUserStore.getState().setVhinfo(null);
  };

  /**
   * Sets up a user session from auth tokens
   */
  setSession = data => {
    logger.debug(NAMESPACE, 'Setting up session');

    try {
      const { accessToken, refreshToken, idToken } = data;
      if (!accessToken || !refreshToken) {
        logger.error(NAMESPACE, 'Missing tokens in setSession', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
        });
        return null;
      }

      const [header, payload] = accessToken.split('.');
      const session = {
        accessToken,
        refreshToken,
        idToken,
        payload: decodeJWT(payload),
        header: decodeJWT(header),
      };

      this.session = session;
      mqtt.setToken(accessToken);
      api.setAccessToken(accessToken);

      setToStorage('user_session', JSON.stringify(session));
      logger.debug(NAMESPACE, 'Session set successfully');

      return session;
    } catch (err) {
      logger.error(NAMESPACE, 'Error in setSession:', err);
      return null;
    }
  };

  /**
   * Calculates time until next token refresh
   */
  calculateTimeUntilRefresh = () => {
    if (!this.session?.payload?.exp) return -1;

    const expiryTime = this.session.payload.exp * 1000;
    const currentTime = new Date().getTime();
    return (expiryTime - currentTime) / 2;
  };

  /**
   * Refreshes the access token when needed
   */
  refreshToken = async () => {
    logger.debug(NAMESPACE, 'Refreshing token', AUTH_CONFIG_ISSUER);
    // Check if session payload is valid
    if (!this.session?.payload?.exp) {
      logger.warn(NAMESPACE, 'Invalid session payload');
      throw new Error('Invalid session payload');
    }

    try {
      const timeToRefresh = this.calculateTimeUntilRefresh();
      logger.debug(NAMESPACE, 'Time until refresh:', timeToRefresh, 'ms');
      this.clearTimeout();

      if (timeToRefresh > 0) {
        logger.debug(
          NAMESPACE,
          'Scheduling refresh in',
          Math.max(timeToRefresh, 1000),
          'ms'
        );
        this.timeout = BackgroundTimer.setTimeout(() => {
          this.refreshToken();
        }, Math.max(timeToRefresh, 1000));
        return;
      }

      logger.debug(NAMESPACE, 'Refreshing token now...');
      const refreshData = await refresh(AUTH_CONFIG, {
        refreshToken: this.session.refreshToken,
      });
      logger.debug(NAMESPACE, 'Token refresh successful', refreshData);

      const session = this.setSession(refreshData);
      if (!session) {
        const msg = 'Failed to set session after refresh';
        logger.debug(NAMESPACE, msg);
        throw new Error(msg);
      }

      this.saveUser(session.payload);
      // Schedule next refresh instead of recursively calling refreshToken
      this.scheduleNextRefresh();
    } catch (err) {
      logger.error(NAMESPACE, 'Refresh Token failed', err);
      this.logout();
    }
  };

  /**
   * Schedules the next token refresh
   */
  scheduleNextRefresh = () => {
    if (!this.session) return;

    const timeToRefresh = this.calculateTimeUntilRefresh();

    if (timeToRefresh > 0) {
      this.clearTimeout();
      this.timeout = BackgroundTimer.setTimeout(() => {
        this.refreshToken();
      }, Math.max(timeToRefresh, 1000));
    } else {
      this.refreshToken();
    }
  };

  startFromStorage = async () => {
    logger.debug(NAMESPACE, 'Starting from storage...');
    const session = await getFromStorage('user_session')
      .then(s => {
        logger.debug(
          NAMESPACE,
          'Retrieved session from storage:',
          s ? 'Session exists' : 'No session'
        );
        return !s ? null : JSON.parse(s);
      })
      .catch(err => {
        logger.error(NAMESPACE, 'Error parsing stored session', err);
        return null;
      });

    if (!session) {
      logger.debug(NAMESPACE, 'No valid session found, logging out');
      return this.logout();
    }

    // Set the session and ensure all necessary properties are available
    try {
      logger.debug(NAMESPACE, 'Restoring session and fetching user');
      this.setSession(session);
      await this.fetchUser(session);
    } catch (err) {
      logger.error(NAMESPACE, 'Error restoring session', err);
      this.logout();
    }
  };

  /**
   * Fetches and validates user information
   */
  fetchUser = async session => {
    logger.debug(NAMESPACE, 'Fetching user info...');
    useUserStore.getState().setWIP(true);

    const roles = session?.payload?.realm_access?.roles;
    const role = getUserRole(roles);
    try {
      await this.refreshToken();
      logger.debug(NAMESPACE, 'Checking permission for role:', role);
      await this.checkPermission(role);
    } catch (err) {
      logger.error(NAMESPACE, 'Error fetching VH info data', err?.message);
      return this.logout();
    }

    this.saveUser(session.payload);
  };

  /**
   * Saves user data to the store
   */
  saveUser = token => {
    try {
      if (!token) {
        logger.error(NAMESPACE, 'No token available');
        return;
      }

      const {
        realm_access: { roles },
        sub,
        given_name,
        name,
        email,
        family_name,
        preferred_username,
      } = token;

      // Add Sentry user tracking
      setSentryUser({
        id: sub,
        username: preferred_username || given_name,
        email: email,
        role: getUserRole(roles),
      });

      addBreadcrumb('auth', 'User authenticated successfully', {
        role: getUserRole(roles),
      });

      const user = {
        id: sub,
        display: fixTextEncoding(name),
        username: fixTextEncoding(given_name),
        familyname: fixTextEncoding(family_name),
        name: fixTextEncoding(name),
        email: email,
        role: getUserRole(roles),
        roles,
      };

      logger.debug(NAMESPACE, 'Setting user in store and setting WIP to false');
      useUserStore.getState().setUser(user);
      useUserStore.getState().setWIP(false);
    } catch (err) {
      logger.error(NAMESPACE, 'Error saving user:', err);
      this.logout();
    }
  };

  /**
   * Checks if the user has required permissions
   */
  checkPermission = async role => {
    logger.debug(NAMESPACE, 'Checking permission for role:', role);
    if (!role) {
      logger.debug(NAMESPACE, 'Permission check failed: No role provided');
      return false;
    }

    try {
      logger.debug(NAMESPACE, 'Fetching VH info...');
      const vhinfo = await api.fetchVHInfo();
      logger.debug(NAMESPACE, 'VH info received:', JSON.stringify(vhinfo));

      useUserStore.getState().setVhinfo(vhinfo);

      const isAuthorized = !!vhinfo.active && role === userRolesEnum.user;
      logger.debug(NAMESPACE, 'Authorization result:', isAuthorized);

      return isAuthorized;
    } catch (err) {
      logger.error(NAMESPACE, 'Error in permission check:', err?.message);
      if (err?.message === 'UNAUTHORIZED') {
        useUserStore.getState().setVhinfo({ active: false });
        return false;
      }

      throw err;
    }
  };

  /**
   * Clears any scheduled timeouts
   */
  clearTimeout = () => {
    if (this.timeout) {
      BackgroundTimer.clearTimeout(this.timeout);
      this.timeout = 0;
    }
  };
}

const keycloakDefault = new Keycloak();

export default keycloakDefault;
