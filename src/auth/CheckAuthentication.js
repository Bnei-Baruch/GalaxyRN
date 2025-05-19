import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

import kc from "./keycloak";
import { useUserStore } from "../zustand/user";
import { useInitsStore } from "../zustand/inits";
import WIP from "../components/WIP";
import UserPermissions from "../components/UserPermissions";
import PrepareRoom from "../InRoom/PrepareRoom";
import { SettingsNotJoined } from "../settings/SettingsNotJoined";

const CheckAuthentication = () => {
  const { user, wip, vhinfo } = useUserStore();
  const { readyForJoin } = useInitsStore();
  const { t } = useTranslation();

  useEffect(() => {
    kc.startFromStorage();
    return () => kc.clearTimeout();
  }, []);

  const handleLogin = () => {
    console.log("Membership validation: login");
    kc.login();
  };

  if (!user) {
    return (
      <WIP isReady={!wip}>
        <View style={[styles.loginContainer, styles.container]}>
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginTxt}>{t("login")}</Text>
          </TouchableOpacity>
        </View>
      </WIP>
    );
  }

  if (vhinfo && !vhinfo.active) {
    return <UserPermissions />;
  }

  return (
    <View style={styles.container}>
      {readyForJoin ? <PrepareRoom /> : <SettingsNotJoined />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loginContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtn: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "blue",
    justifyContent: "center",
    alignItems: "center",
  },
  loginTxt: {
    color: "white",
    fontSize: 30,
  },
});

export default CheckAuthentication;
