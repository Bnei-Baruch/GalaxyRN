import { AUTH_CONFIG_ISSUER } from '@env';
import { decode } from 'base-64';
import { AppState } from 'react-native';
import { authorize, logout, refresh } from 'react-native-app-auth';
import BackgroundTimer from '../services/BackgroundTimer';
import RNSecureStorage from 'rn-secure-storage';
import { STORAGE_KEYS } from '../constants';
import { getUserRole, userRolesEnum } from '../enums';
import {
  addBreadcrumb,
  clearUser as clearSentryUser,
  setUser as setSentryUser,
} from '../libs/sentry/sentryHelper';
import api from '../services/Api';
import logger from '../services/logger';
import { fixTextEncoding, getFromStorage, setToStorage } from '../tools';
import { useUserStore } from '../zustand/user';

const { config: { isProduction } } = require('../../package.json');

const NAMESPACE = 'Keycloak';

// Refresh the access token this many ms before it actually expires. Leaves
// room for retries on a flaky network before the old token is rejected.
const REFRESH_BUFFER_MS = 60000;

// Retry delays for refresh failures that aren't a rejection of the refresh
// token itself (no network, server unreachable) - the last one repeats.
const REFRESH_RETRY_DELAYS_MS = [5000, 10000, 30000, 60000];

// Error codes (same on iOS and Android) meaning the refresh token/client is
// no longer accepted - only these end the session.
const FATAL_REFRESH_ERRORS = [
  'invalid_grant',
  'invalid_client',
  'unauthorized_client',
];

// Configuration
const AUTH_CONFIG = {
  issuer: AUTH_CONFIG_ISSUER,
  clientId: 'galaxy',
  redirectUrl: 'com.galaxy://callback',
  scopes: ['openid', 'profile'],
  postLogoutRedirectUrl: 'com.galaxy://callback',
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
    this.refreshPromise = null;
    this.retryAttempt = 0;

    // The scheduled refresh timer can fire late or not at all while the app is
    // backgrounded (CPU sleep / Doze / iOS suspension) - catch up on resume.
    AppState.addEventListener('change', state => {
      if (state === 'active' && this.session && this.isTokenExpiring()) {
        logger.info(NAMESPACE, 'App resumed with expiring token, refreshing');
        this.doRefresh();
      }
    });
  }

  /**
   * Initiates the login process
   */
  login = async () => {
    logger.debug(NAMESPACE, 'login');
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
    logger.debug(NAMESPACE, 'logout');
    this.clearTimeout();
    this.retryAttempt = 0;

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
      await RNSecureStorage.removeItem(STORAGE_KEYS.USER_SESSION);
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
      setToStorage(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
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
    const timeToRefresh = expiryTime - currentTime - REFRESH_BUFFER_MS;
    logger.debug(NAMESPACE, 'time until refresh', timeToRefresh);
    return timeToRefresh;
  };

  refreshToken = async () => {
    if (!this.session?.payload?.exp) {
      logger.warn(NAMESPACE, 'Invalid session payload');
      throw new Error('Invalid session payload');
    }

    const timeToRefresh = this.calculateTimeUntilRefresh();
    this.clearTimeout();

    if (timeToRefresh > 0) {
      logger.debug(NAMESPACE, 'Scheduling refresh in', timeToRefresh, 'ms');
      this.timeout = BackgroundTimer.setTimeout(() => {
        this.doRefresh();
      }, timeToRefresh);
      return;
    }

    await this.doRefresh();
  };

  isTokenExpiring = () => this.calculateTimeUntilRefresh() <= 0;

  /**
   * Returns an access token that isn't about to expire, refreshing first if
   * needed (or always, with `force`). Returns null if there is no session.
   */
  getValidToken = async (force = false) => {
    if (!this.session) return null;

    if (force || this.isTokenExpiring()) {
      logger.info(NAMESPACE, 'getValidToken: refreshing', { force });
      await this.doRefresh();
    }
    return this.getToken();
  };

  /**
   * Refreshes the token; concurrent callers share the in-flight refresh
   */
  doRefresh = () => {
    if (!this.refreshPromise) {
      this.refreshPromise = this.runRefresh().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  };

  runRefresh = async () => {
    logger.debug(NAMESPACE, 'Refreshing token', AUTH_CONFIG_ISSUER);
    if (!this.session?.refreshToken) {
      logger.warn(NAMESPACE, 'No session to refresh');
      return;
    }

    let refreshData;
    try {
      logger.debug(NAMESPACE, 'Refreshing token now...');
      refreshData = await refresh(AUTH_CONFIG, {
        refreshToken: this.session.refreshToken,
      });
    } catch (err) {
      if (FATAL_REFRESH_ERRORS.includes(err?.code)) {
        logger.error(NAMESPACE, 'Refresh token rejected, logging out', err);
        this.logout();
        return;
      }
      this.scheduleRetry(err);
      return;
    }

    logger.debug(NAMESPACE, 'Token refresh successful', refreshData);
    const session = this.setSession(refreshData);
    if (!session) {
      logger.error(NAMESPACE, 'Failed to set session after refresh');
      this.logout();
      return;
    }

    this.retryAttempt = 0;
    this.saveUser(session.payload);
    this.refreshToken();
  };

  scheduleRetry = err => {
    const delay =
      REFRESH_RETRY_DELAYS_MS[
        Math.min(this.retryAttempt, REFRESH_RETRY_DELAYS_MS.length - 1)
      ];
    this.retryAttempt += 1;
    logger.warn(NAMESPACE, 'Refresh Token failed, retrying', {
      attempt: this.retryAttempt,
      delay,
      code: err?.code,
      message: err?.message,
    });

    this.clearTimeout();
    this.timeout = BackgroundTimer.setTimeout(() => {
      this.doRefresh();
    }, delay);
  };

  startFromStorage = async () => {
    logger.debug(NAMESPACE, 'Starting from storage...');
    const session = await getFromStorage(STORAGE_KEYS.USER_SESSION)
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
      const vhinfo = await (isProduction ? api.fetchVHInfo() : Promise.resolve({ active: true, allowed: true }));
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
  getToken = () => {
    return this.session?.accessToken;
  };
}

const keycloakDefault = new Keycloak();

export default keycloakDefault;
