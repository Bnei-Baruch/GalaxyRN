import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { withProfiler } from '../../libs/sentry/sentryHOC';
import logger from '../../services/logger';
import { useFeedsStore } from '../../zustand/feeds';
import { useInRoomStore } from '../../zustand/inRoom';
import { useMyStreamStore } from '../../zustand/myStream';
import { useSettingsStore } from '../../zustand/settings';
import { useUiActions } from '../../zustand/uiActions';
import Feed from './Feed';
import FeedAudioMode from './FeedAudioMode';
import MyAudioMode from './MyAudioMode';
import MyRoomMedia from './MyRoomVideo';

const NAMESPACE = 'Feeds';

const Feeds = () => {
  const { audioMode, hideSelf, isFullscreen } = useSettingsStore();
  const cammute = useMyStreamStore(state => state.cammute);
  const setFeedsPos = useUiActions(state => state.setFeedsPos);
  const isInBackground = useInRoomStore(state => state.isInBackground);
  const feedIds = useFeedsStore(state => state.feedIds);

  const ref = useRef({});

  const handleLayout = event => {
    const layoutY = event.nativeEvent.layout.y;
    setFeedsPos(layoutY);
  };

  const renderMy = () => {
    if (hideSelf || isFullscreen) return null;
    if (audioMode && cammute) {
      return <MyAudioMode key="my" />;
    }
    return <MyRoomMedia key="my" />;
  };

  const renderFeed = id => {
    if (!id) return null;

    if (id === 'my') {
      return renderMy();
    }

    if (audioMode || isInBackground || isFullscreen) {
      return <FeedAudioMode key={id} id={id} />;
    }
    return <Feed key={id} id={id} />;
  };

  logger.debug(NAMESPACE, 'render', feedIds.length);
  return (
    <View style={styles.container} onLayout={handleLayout} ref={ref}>
      {feedIds.length > 0 ? feedIds.map(renderFeed) : renderMy()}
    </View>
  );
};

export default withProfiler(Feeds, { name: 'Feeds' });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: '100%',
  },
});
