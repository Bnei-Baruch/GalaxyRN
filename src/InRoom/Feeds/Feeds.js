import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useInRoomStore } from '../../zustand/inRoom';
import { useMyStreamStore } from '../../zustand/myStream';
import { useSettingsStore } from '../../zustand/settings';
import { useUiActions } from '../../zustand/uiActions';
import Feed from './Feed';
import FeedAudioMode from './FeedAudioMode';
import MyAudioMode from './MyAudioMode';
import MyRoomMedia from './MyRoomVideo';

const Feeds = () => {
  const { audioMode, hideSelf } = useSettingsStore();
  const { cammute } = useMyStreamStore();
  const { setFeedsPos } = useUiActions();
  const { feedIds } = useInRoomStore();

  const ref = useRef({});

  const handleLayout = event => {
    const layoutY = event.nativeEvent.layout.y;
    setFeedsPos(layoutY);
  };

  const renderMy = () => {
    if (hideSelf) return null;
    if (audioMode && cammute) return <MyAudioMode key="my" />;
    return <MyRoomMedia key="my" />;
  };

  const renderFeed = id => {
    if (!id) return null;

    if (id === 'my') {
      return renderMy();
    }

    if (audioMode) return <FeedAudioMode key={id} id={id} />;
    return <Feed key={id} id={id} />;
  };

  return (
    <View style={styles.container} onLayout={handleLayout} ref={ref}>
      {feedIds.length > 0 ? feedIds.map(renderFeed) : renderMy()}
    </View>
  );
};

export default Feeds;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: '100%',
  },
});
