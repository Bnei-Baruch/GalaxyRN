import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { baseStyles } from "../constants";
import { useInitsStore } from "../zustand/inits";
import { topMenuBtns } from "../topBar/helper";

const VersionInfo = () => {
  const { versionInfo } = useInitsStore();
  if (!versionInfo) return null;

  return (
    <View style={topMenuBtns.btn}>
      <Text style={[styles.text, baseStyles.text]}>
        app v{versionInfo.versionName} ({versionInfo.versionCode})
      </Text>
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
