import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const TextDisplayWithButton = ({ label, value, button = null, input = null }) => {
  let _content = null;
  if (input) {
    _content = input;
  } else if (value) {
    _content = <Text style={styles.displayText}>{value}</Text>;
  }

    return(
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
      <View style={styles.displayContainer}>
        <View style={styles.textContainer}>
          {_content}
        </View>
        <View style={styles.buttonContainer}>{button}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: "relative",
  },
  labelContainer: {
    position: "absolute",
    top: -10,
    left: 10,
    paddingHorizontal: 5,
    zIndex: 1,
    backgroundColor: "black",
  },
  label: {
    color: "white",
    fontSize: 12,
  },
  displayContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#9e9e9e",
    flexWrap: "nowrap",
    height: 40,
    borderRadius: 5,
  },
  textContainer: {
    justifyContent: "center",
    paddingVertical: 8,
    flex: 1,
    paddingHorizontal: 10,
  },
  displayText: {
    fontSize: 16,
    color: "white",
  },
  buttonContainer: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

export { TextDisplayWithButton };
