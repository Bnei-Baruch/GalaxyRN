import React, { useEffect } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import logger from "../services/logger";
import { getFromStorage } from "../shared/tools";
import { useSettingsStore } from "../zustand/settings";

const SendLogs = () => {
  const { debugMode, toggleDebugMode } = useSettingsStore();

  useEffect(() => {
    const initDebugMode = async () => {
      const debugMode = await getFromStorage("debugMode").then((value) => {
        return value === "true";
      });
      toggleDebugMode(debugMode);
    };
    initDebugMode();
  }, [toggleDebugMode]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Send Logs</Text>
      <Switch
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={debugMode ? "#f5dd4b" : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleDebugMode}
        value={debugMode}
      />
      {debugMode && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => logger.sendFile()}
        >
          <Text style={styles.buttonText}>Send with email</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 16,
    color: "white",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});

export default SendLogs;
