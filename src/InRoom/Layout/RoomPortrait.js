import React from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";

import { useShidurStore } from "../../zustand/shidur";
import { useUiActions } from "../../zustand/uiActions";
import { baseStyles } from "../../constants";
import WIP from "../../components/WIP";

const RoomPortrait = ({ shidur, quads, members, subtitle }) => {
  const { janusReady } = useShidurStore();
  const { setFeedsScrollY, toggleShowBars } = useUiActions();

  const handleAnyPress = () => toggleShowBars(true);

  const handleScroll = (e) => setFeedsScrollY(e.nativeEvent.contentOffset.y);

  const { width } = Dimensions.get("window");

  return (
    <View style={styles.container}>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        style={baseStyles.full}
        onScroll={handleScroll}
      >
        <TouchableWithoutFeedback onPress={handleAnyPress}>
          <View style={styles.scrollContent}>
            <WIP isReady={janusReady}>
              <View style={[baseStyles.full, { width }]}>
                {shidur}
                {subtitle}
                {quads}
              </View>
            </WIP>
            {members}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};
export default RoomPortrait;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    flexDirection: "column",
  },
  scrollContent: {
    flex: 1,
    minHeight: "100%",
  },
});
