import mqtt from "../shared/mqtt";
import { authorize, logout, refresh } from "react-native-app-auth";
import { Linking } from "react-native";
import RNSecureStorage from "rn-secure-storage";
import { decode } from "base-64";
import log from "loglevel";
import api from "../shared/Api";
import { getUserRole, userRolesEnum } from "../shared/enums";
import { useUserStore } from "../zustand/user";
import { setToStorage } from "../shared/tools";
import BackgroundTimer from "react-native-background-timer";
import { sendSentry } from "../sentryHelper";
import { AUTH_CONFIG_ISSUER, MEMBERSHIP_URL } from "@env";
// Configuration
const AUTH_CONFIG = {
  issuer: AUTH_CONFIG_ISSUER,
  clientId: "galaxy",
  redirectUrl: "com.galaxy://callback",
  scopes: ["openid", "profile"],
  postLogoutRedirectUrl: "com.galaxy://callback",
};

// JWT Helpers
const decodeJWTPayload = (token) =>
  token ? JSON.parse(decode(token.split(".")[1])) : {};

const decodeJWTHeader = (token) =>
  token ? JSON.parse(decode(token.split(".")[0])) : {};

const openMembershipPage = () => {
  try {
    console.log("openMembershipPage: MEMBERSHIP_URL", MEMBERSHIP_URL);
    Linking.openURL(MEMBERSHIP_URL);
  } catch (error) {
    console.error("openMembershipPage: Error opening membership page", error);
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
        log.debug("Login successful", authData);
        const session = this.setSession(authData);

        if (!session) {
          return this.logout();
        }

        return this.fetchUser(session);
      })
      .catch((error) => {
        log.error("Login failed", error);
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
        log.error("Logout error", error);
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

    const session = {
      accessToken,
      refreshToken,
      idToken,
      payload: decodeJWTPayload(accessToken),
      header: decodeJWTHeader(accessToken),
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
    sendSentry(`start refreshToken is this.session: ${!!this.session}`);

    if (!this.session) return;

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

    sendSentry(`start refreshToken timeToRefresh: ${timeToRefresh}`);

    try {
      const refreshData = await refresh(AUTH_CONFIG, {
        refreshToken: this.session.refreshToken,
      });

      const session = this.setSession(refreshData);
      if (!session) return this.logout();

      this.saveUser(session.payload);
      return this.refreshToken();
    } catch (error) {
      log.error("Refresh Token failed", error);
      this.logout();
    }
  };

  /**
   * Fetches and validates user information
   */
  fetchUser = async (session) => {
    useUserStore.getState().setWIP(true);

    const roles = session?.payload?.realm_access?.roles;
    const role = getUserRole(roles);

    const allowed = await this.checkPermission(role);
    if (!allowed) {
      openMembershipPage();
      return this.logout();
    }

    const isTokenExpired = new Date(session.payload.exp * 1000) < new Date();

    if (isTokenExpired) {
      sendSentry(`fetchUser token_expired: ${isTokenExpired}`);
      await this.refreshToken();
      return;
    }

    // Save user data on successful validation
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

    let vhinfo;
    try {
      vhinfo = await api.fetchVHInfo();
      log.debug("Membership validation: vhinfo", vhinfo);
    } catch (error) {
      log.error(
        "Membership validation: Error fetching VH info data",
        error?.message
      );
      vhinfo = { active: false, error: error?.message };
    }

    useUserStore.getState().setVhinfo(vhinfo);

    const isAuthorized = !!vhinfo.active && role === userRolesEnum.user;
    log.debug("Membership validation state:", {
      active: vhinfo.active,
      roleIsUser: role === userRolesEnum.user,
    });

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

const keycloak = new Keycloak();

export default keycloak;
