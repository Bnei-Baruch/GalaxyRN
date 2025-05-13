import mqtt from "../shared/mqtt";
import { authorize, logout, refresh } from "react-native-app-auth";
import { Linking } from "react-native";
import RNSecureStorage from "rn-secure-storage";
import { decode } from "base-64";
import log from "loglevel";
import api from "../shared/Api";
import { getUserRole, userRolesEnum } from "../shared/enums";
import { useUserStore } from "../zustand/user";
import BackgroundTimer from "react-native-background-timer";
import { sendSentry, setUser as setSentryUser, clearUser as clearSentryUser, addBreadcrumb } from "../sentryHelper";
import { AUTH_CONFIG_ISSUER, MEMBERSHIP_URL } from "@env";
import { setToStorage, getFromStorage } from "../shared/tools";

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
  } catch (error) {
    console.error("Error decoding JWT", error);
    return {};
  }
}

const openMembershipPage = () => {
  try {
    Linking.openURL(MEMBERSHIP_URL);
  } catch (error) {
    console.error("Error opening membership page", error);
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
      .catch((error) => {
        console.error("Login failed", error);
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
      } catch (error) {
        console.error("Logout error", error);
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
    console.log("[keycloak] Setting up session");
    
    try {
      const { accessToken, refreshToken, idToken } = data;
      if (!accessToken || !refreshToken) {
        console.error("[keycloak] Missing tokens in setSession", { 
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
      console.log("[keycloak] Session set successfully");

      return session;
    } catch (error) {
      console.error("[keycloak] Error in setSession:", error);
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
      console.log("[keycloak] No session to refresh");
      return;
    }
    
    console.log("[keycloak] Starting token refresh, expiry:", this.session.payload.exp);
    
    try {
      // Check if session payload is valid
      if (!this.session.payload || !this.session.payload.exp) {
        console.error("[keycloak] Invalid session payload");
        return this.logout();
      }
    
      const timeToRefresh = this.calculateTimeUntilRefresh();
      console.log("[keycloak] Time until refresh:", timeToRefresh, "ms");
      this.clearTimeout();

      if (timeToRefresh > 0) {
        console.log("[keycloak] Scheduling refresh in", Math.max(timeToRefresh, 1000), "ms");
        this.timeout = BackgroundTimer.setTimeout(() => {
          sendSentry("check keycloak: refresh token");
          this.refreshToken();
        }, Math.max(timeToRefresh, 1000));
        return;
      }

      console.log("[keycloak] Refreshing token now...");
      const refreshData = await refresh(AUTH_CONFIG, {
        refreshToken: this.session.refreshToken,
      });
      console.log("[keycloak] Token refresh successful");

      const session = this.setSession(refreshData);
      if (!session) {
        console.log("[keycloak] Failed to set session after refresh");
        return this.logout();
      }

      this.saveUser(session.payload);
      // Schedule next refresh instead of recursively calling refreshToken
      this.scheduleNextRefresh();
    } catch (error) {
      console.error("[keycloak] Refresh Token failed", error);
      sendSentry("Refresh token failed: " + error.message);
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
    console.log("[keycloak] Starting from storage...");
    const session = await getFromStorage("user_session")
      .then((s) => {
        console.log("[keycloak] Retrieved session from storage:", s ? "Session exists" : "No session");
        return !s ? null : JSON.parse(s);
      })
      .catch(error => {
        console.error("Error parsing stored session", error);
        return null;
      });

    if (!session) {
      console.log("[keycloak] No valid session found, logging out");
      return this.logout();
    }

    // Set the session and ensure all necessary properties are available
    try {
      console.log("[keycloak] Restoring session and fetching user");
      this.setSession(session);
      this.fetchUser(session);
    } catch (error) {
      console.error("Error restoring session", error);
      this.logout();
    }
  };
  /**
   * Fetches and validates user information
   */
  fetchUser = async (session) => {
    console.log("[keycloak] Fetching user info...");
    useUserStore.getState().setWIP(true);

    const roles = session?.payload?.realm_access?.roles;
    const role = getUserRole(roles);
    try {
      await this.refreshToken();
      console.log("[keycloak] Checking permission for role:", role);
      const allowed = await this.checkPermission(role);
      console.log("[keycloak] fetchUser allowed", allowed);
      if (!allowed) {
        openMembershipPage();
        return this.logout();
      }
    } catch (error) {
      console.error("Error fetching VH info data", error?.message);
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
        console.error("[keycloak] No token available");
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

      console.log("[keycloak] Setting user in store and setting WIP to false");
      useUserStore.getState().setUser(user);
      useUserStore.getState().setWIP(false);
    } catch (error) {
      console.error("[keycloak] Error saving user:", error);
      this.logout();
    }
  };

  /**
   * Checks if the user has required permissions
   */
  checkPermission = async (role) => {
    if (!role) return false;

    const vhinfo = await api.fetchVHInfo();

    useUserStore.getState().setVhinfo(vhinfo);

    const isAuthorized = !!vhinfo.active && role === userRolesEnum.user;

    return isAuthorized;
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
