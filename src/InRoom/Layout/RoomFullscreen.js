import React from "react";
import { View, StyleSheet } from "react-native";

const RoomFullscreen = ({ shidur }) => {
  return <View style={styles.container}>
    <View style={styles.shidur}>
      {shidur}
    </View>
  </View>;
};
export default RoomFullscreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  shidur: {
    flex: 1,
    height: "100%",
    aspectRatio: 16 / 9,
  },
});
