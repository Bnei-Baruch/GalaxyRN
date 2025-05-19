import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { baseStyles } from "../constants";
import { useVersionStore } from "../zustand/version";
import { topMenuBtns } from "../topBar/helper";

const VersionInfo = () => {
  const { currentVersion, latestVersion, updateAvailable, openAppStore } =
    useVersionStore();

  if (!latestVersion) return null;

  return (
    <View style={topMenuBtns.btn}>
      <Text style={[styles.text, baseStyles.text]}>
        app v{currentVersion} ({latestVersion})
      </Text>
      {updateAvailable && (
        <TouchableOpacity onPress={openAppStore}>
          <Text style={[styles.text, baseStyles.text]}>
            {t("update.updateNow")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    marginVertical: 2,
  },
});

export default VersionInfo;
