import mqtt from "../shared/mqtt";
import { authorize, logout, refresh } from "react-native-app-auth";
import { Linking } from "react-native";
import RNSecureStorage from "rn-secure-storage";
import { decode } from "base-64";
import api from "../shared/Api";
import { getUserRole, userRolesEnum } from "../shared/enums";
import { useUserStore } from "../zustand/user";
import BackgroundTimer from "react-native-background-timer";
import { sendSentry, setUser as setSentryUser, clearUser as clearSentryUser, addBreadcrumb } from "../libs/sentry/sentryHelper";
import { AUTH_CONFIG_ISSUER } from "@env";
import { setToStorage, getFromStorage } from "../shared/tools";
import { debug, error } from '../services/logger';

const NAMESPACE = 'Keycloak';

// Configuration
const AUTH_CONFIG = {
  issuer: AUTH_CONFIG_ISSUER,
  clientId: "galaxy",
  redirectUrl: "com.galaxy://callback",
  scopes: ["openid", "profile"],
  postLogoutRedirectUrl: "com.galaxy://callback",
};

// JWT Helpers
const decodeJWT = (token) =>{
  if (!token) return {};

  try {
    return JSON.parse(decode(token));
  } catch (err) {
    error(NAMESPACE, "Error decoding JWT", err);
    return {};
  }
}

class Keycloak {
  constructor() {
    this.session = null;
    this.timeout = 0;
  }

  /**
   * Initiates the login process
   */
  login = () => {
    useUserStore.getState().setWIP(true);

    authorize(AUTH_CONFIG)
      .then((authData) => {
        const session = this.setSession(authData);

        if (!session) {
          return this.logout();
        }

        return this.fetchUser(session);
      })
      .catch((err) => {
        error(NAMESPACE, "Login failed", err);
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
        error(NAMESPACE, "Logout error", err);
      }
    }

    this.session = null;
    RNSecureStorage.removeItem("user_session");
    useUserStore.getState().setUser(null);
  };

  /**
   * Sets up a user session from auth tokens
   */
  setSession = (data) => {
    debug(NAMESPACE, "Setting up session");
    
    try {
      const { accessToken, refreshToken, idToken } = data;
      if (!accessToken || !refreshToken) {
        error(NAMESPACE, "Missing tokens in setSession", { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken 
        });
        return null;
      }
      
      const [header, payload] = accessToken.split(".");
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

      setToStorage("user_session", JSON.stringify(session));
      debug(NAMESPACE, "Session set successfully");

      return session;
    } catch (err) {
      error(NAMESPACE, "Error in setSession:", err);
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
    if (!this.session) {
      debug(NAMESPACE, "No session to refresh");
      return;
    }
    
    debug(NAMESPACE, "Starting token refresh, expiry:", this.session.payload.exp);
    
    try {
      // Check if session payload is valid
      if (!this.session.payload || !this.session.payload.exp) {
        error(NAMESPACE, "Invalid session payload");
        return this.logout();
      }
    
      const timeToRefresh = this.calculateTimeUntilRefresh();
      debug(NAMESPACE, "Time until refresh:", timeToRefresh, "ms");
      this.clearTimeout();

      if (timeToRefresh > 0) {
        debug(NAMESPACE, "Scheduling refresh in", Math.max(timeToRefresh, 1000), "ms");
        this.timeout = BackgroundTimer.setTimeout(() => {
          sendSentry("check keycloak: refresh token");
          this.refreshToken();
        }, Math.max(timeToRefresh, 1000));
        return;
      }

      debug(NAMESPACE, "Refreshing token now...");
      const refreshData = await refresh(AUTH_CONFIG, {
        refreshToken: this.session.refreshToken,
      });
      debug(NAMESPACE, "Token refresh successful");

      const session = this.setSession(refreshData);
      if (!session) {
        debug(NAMESPACE, "Failed to set session after refresh");
        return this.logout();
      }

      this.saveUser(session.payload);
      // Schedule next refresh instead of recursively calling refreshToken
      this.scheduleNextRefresh();
    } catch (err) {
      error(NAMESPACE, "Refresh Token failed", err);
      sendSentry("Refresh token failed: " + err.message);
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
    debug(NAMESPACE, "Starting from storage...");
    const session = await getFromStorage("user_session")
      .then((s) => {
        debug(NAMESPACE, "Retrieved session from storage:", s ? "Session exists" : "No session");
        return !s ? null : JSON.parse(s);
      })
      .catch(err => {
        error(NAMESPACE, "Error parsing stored session", err);
        return null;
      });

    if (!session) {
      debug(NAMESPACE, "No valid session found, logging out");
      return this.logout();
    }

    // Set the session and ensure all necessary properties are available
    try {
      debug(NAMESPACE, "Restoring session and fetching user");
      this.setSession(session);
      this.fetchUser(session);
    } catch (err) {
      error(NAMESPACE, "Error restoring session", err);
      this.logout();
    }
  };
  /**
   * Fetches and validates user information
   */
  fetchUser = async (session) => {
    debug(NAMESPACE, "Fetching user info...");
    useUserStore.getState().setWIP(true);

    const roles = session?.payload?.realm_access?.roles;
    const role = getUserRole(roles);
    try {
      await this.refreshToken();
      debug(NAMESPACE, "Checking permission for role:", role);
      await this.checkPermission(role);
    } catch (err) {
      error(NAMESPACE, "Error fetching VH info data", err?.message);
      return this.logout();
    }
    
    this.saveUser(session.payload);
  };

  /**
   * Saves user data to the store
   */
  saveUser = (token) => {
    try {
      if (!token) {
        error(NAMESPACE, "No token available");
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
        role: getUserRole(roles)
      });
      
      addBreadcrumb('auth', 'User authenticated successfully', { 
        role: getUserRole(roles) 
      });

      const user = {
        id: sub,
        display: name,
        username: given_name,
        familyname: family_name,
        name,
        email,
        role: getUserRole(roles),
        roles,
      };

      debug(NAMESPACE, "Setting user in store and setting WIP to false");
      useUserStore.getState().setUser(user);
      useUserStore.getState().setWIP(false);
    } catch (err) {
      error(NAMESPACE, "Error saving user:", err);
      this.logout();
    }
  };

  /**
   * Checks if the user has required permissions
   */
  checkPermission = async (role) => {
    debug(NAMESPACE, "Checking permission for role:", role);
    if (!role) {
      debug(NAMESPACE, "Permission check failed: No role provided");
      return false;
    }

    try {
      debug(NAMESPACE, "Fetching VH info...");
      const vhinfo = await api.fetchVHInfo();
      debug(NAMESPACE, "VH info received:", JSON.stringify(vhinfo));

      useUserStore.getState().setVhinfo(vhinfo);

      const isAuthorized = !!vhinfo.active && role === userRolesEnum.user;
      debug(NAMESPACE, "Authorization result:", isAuthorized, {
        active: !!vhinfo.active,
        roleMatches: role === userRolesEnum.user,
        role,
        expectedRole: userRolesEnum.user
      });

      return isAuthorized;
    } catch (err) {
      error(NAMESPACE, "Error in permission check:", err);
      return false;
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
