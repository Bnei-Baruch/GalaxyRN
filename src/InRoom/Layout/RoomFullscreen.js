import React from "react";
import { Modal } from "react-native";
import { useSettingsStore } from "../../zustand/settings";
import { View, StyleSheet } from "react-native";

const RoomFullscreen = ({ shidur }) => {
  const { toggleIsFullscreen } = useSettingsStore();

  return (
    <Modal
      visible={true}
      onRequestClose={toggleIsFullscreen}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      supportedOrientations={["landscape"]}
    >
      <View style={styles.container}>
    <View style={styles.shidur}>
      {shidur}
    </View>
  </View>
    </Modal>
  );
};
export default RoomFullscreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  shidur: {
    flex: 1,
    height: "100%",
    aspectRatio: 16 / 9,
  },
});
