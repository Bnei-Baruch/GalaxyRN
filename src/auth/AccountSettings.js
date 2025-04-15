import React from "react";
import { StyleSheet, Text, View, Linking } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ListInModal from "../components/ListInModal";
import { useTranslation } from "react-i18next";
import { useUserStore } from "../zustand/user";
import kc from "./keycloak";
import { baseStyles } from "../constants";
import IconWithText from "../settings/IconWithText";

const ACCOUNT_URL = "https://accounts.kab.info/auth/realms/main/account";

const AccountSettings = () => {
  const { t } = useTranslation();
  const { user } = useUserStore();

  const accauntOptions = [
    {
      key: "account",
      value: "account",
      text: t("user.account"),
      action: () => {
        try {
          Linking.openURL(ACCOUNT_URL);
        } catch (error) {
          console.error("Error opening account page", error);
        }
      },
    },
    {
      key: "logout",
      value: "logout",
      text: t("user.logout"),
      action: () => kc.logout(),
    },
  ];

  const handleSelect = (item) => item.action && item.action();

  const renderItem = (item) => (
    <Text style={[baseStyles.text, baseStyles.listItem]}>{item.text}</Text>
  );

  return (
    <View style={styles.container}>
      <IconWithText iconName="account-circle" text={t("user.title")} />

      <Text style={[styles.label, baseStyles.text]}>{t("user.name")}</Text>

      <ListInModal
        items={accauntOptions}
        onSelect={handleSelect}
        renderItem={renderItem}
        trigger={
          <View style={styles.inputWrapper}>
            <Text style={[styles.input, { disabled: true }]}>
              {user?.display}
            </Text>
            <Icon name="arrow-drop-down" size={30} color="white" />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  dropdownContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.23)",
    color: "rgba(255, 255, 255, 0.66)",
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  disabled: {
    color: "grey",
  },
});

export default AccountSettings;
