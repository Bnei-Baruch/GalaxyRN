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
import { sendSentry } from "../sentryHelper";
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
    const { accessToken, refreshToken, idToken } = data;
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

    return session;
  };

  /**
   * Refreshes the access token when needed
   */
  refreshToken = async () => {
    
    if (!this.session) return;
    
    console.log("[keycloak] refreshToken", this.session.payload.exp);
    const expiryTime = this.session.payload.exp * 1000;
    const currentTime = new Date().getTime();
    const timeToRefresh = expiryTime - currentTime / 2;

    this.clearTimeout();

    if (timeToRefresh > 0) {
      this.timeout = BackgroundTimer.setTimeout(() => {
        sendSentry("check keycloak: refresh token");
        this.refreshToken();
      }, Math.max(timeToRefresh, 1000));
      return;
    }

    try {
      const refreshData = await refresh(AUTH_CONFIG, {
        refreshToken: this.session.refreshToken,
      });

      const session = this.setSession(refreshData);
      if (!session) return this.logout();

      this.saveUser(session.payload);
      return this.refreshToken();
    } catch (error) {
      console.error("Refresh Token failed", error);
      this.logout();
    }
  };

  startFromStorage = async () => {
    const session = await getFromStorage("user_session").then((s) =>
      JSON.parse(s)
    );

    if (!session) return this.logout();

    this.setSession(session);
    this.fetchUser(session);
  };
  /**
   * Fetches and validates user information
   */
  fetchUser = async (session) => {
    useUserStore.getState().setWIP(true);

    const roles = session?.payload?.realm_access?.roles;
    const role = getUserRole(roles);
    try {
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

    this.refreshToken();
    
    this.saveUser(session.payload);
  };

  /**
   * Saves user data to the store
   */
  saveUser = (token) => {
    const {
      realm_access: { roles },
      sub,
      given_name,
      name,
      email,
      family_name,
    } = token;

    const user = {
      id: sub,
      display: name,
      username: given_name,
      familyname: family_name,
      isClient: true,
      role: getUserRole(roles),
      email,
      roles,
      allowed: true,
    };

    useUserStore.getState().setUser(user);
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
