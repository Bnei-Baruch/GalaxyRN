import { useInRoomStore } from "../../zustand/inRoom";
import { StyleSheet, View } from "react-native";
import Feed from "./Feed";
import { useSettingsStore } from "../../zustand/settings";
import MyRoomMedia from "./MyRoomVideo";
import FeedAudioMode from "./FeedAudioMode";
import { useMyStreamStore } from "../../zustand/myStream";
import { useRef } from "react";
import { useUiActions } from "../../zustand/uiActions";
import MyAudioMode from "./MyAudioMode";

const Feeds = () => {
  const { audioMode } = useSettingsStore();
  const { cammute } = useMyStreamStore();
  const { setFeedsPos } = useUiActions();
  const { feedIds } = useInRoomStore();

  const ref = useRef({});

  const handleLayout = (event) => setFeedsPos(event.nativeEvent.layout.y);

  return (
    <View style={styles.container} onLayout={handleLayout} ref={ref}>
      {feedIds.length > 0 ? (
        feedIds.map((id) => {
          if (!id) return null;
          if (id === "my")
            return audioMode && cammute ? (
              <MyAudioMode key={id} />
            ) : (
              <MyRoomMedia key={id} />
            );

          if (audioMode) return <FeedAudioMode key={id} id={id} />;

          return <Feed key={id} id={id} />;
        })
      ) : (
        <MyRoomMedia />
      )}
    </View>
  );
};
export default Feeds;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    minHeight: "100%",
  },
});
