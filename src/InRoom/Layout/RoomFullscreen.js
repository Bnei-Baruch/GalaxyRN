import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Orientation from "react-native-orientation-locker";
import { useUiActions } from "../../zustand/uiActions";

const RoomFullscreen = ({ shidur }) => {
  const { toggleShowBars } = useUiActions();
  useEffect(() => {
    Orientation.lockToLandscape();

    toggleShowBars(false, false);

    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

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
