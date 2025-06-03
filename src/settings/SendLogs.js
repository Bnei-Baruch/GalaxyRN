import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { useSettingsStore } from "../zustand/settings";
import { logger } from "../services/logger";

const SendLogs = () => {
  const { debugMode, toggleDebugMode } = useSettingsStore();

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
        <TouchableOpacity style={styles.button} onPress={logger.sendFile}>
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
  },
});

export default SendLogs;
