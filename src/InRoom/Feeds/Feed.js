import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import WIP from '../../components/WIP';
import logger from '../../services/logger';
import { useInRoomStore } from '../../zustand/inRoom';
import { useUiActions } from '../../zustand/uiActions';
import CammutedFeed from './CammutedFeed';
import FeedDisplay from './FeedDisplay';
import QuestionOverlay from './QuestionOverlay';

const NAMESPACE = 'Feed';

const Feed = ({ id }) => {
  const { feedById, activateFeedsVideos, deactivateFeedsVideos } =
    useInRoomStore();
  const { borders, width } = useUiActions();

  const ref = useRef();

  const feed = feedById[id];

  const { display: { display } = {}, talking, camera, question } = feed || {};

  const activateDeactivate = (top = 0, bottom = 0, feedId) => {
    if (!ref.current) return;

    const { height, y } = ref.current;
    if (y + height - 10 > top && y - 10 < bottom) {
      activateFeedsVideos([feedId]);
    } else {
      deactivateFeedsVideos([feedId]);
    }
  };

  useEffect(() => {
    const { top, bottom } = borders;
    activateDeactivate(top, bottom, id);
  }, [borders, id]);

  if (!feed) return null;

  let url;
  try {
    if (feed.stream) {
      url = feed.stream.toURL();
    }
  } catch (e) {
    logger.error(NAMESPACE, 'Feed url error', e);
  }

  const handleLayout = event => {
    const { y, height } = event.nativeEvent.layout;
    ref.current = { y, height };
    activateDeactivate(borders.top, borders.bottom, id);
  };

  const renderContent = () => {
    if (!camera) {
      return <CammutedFeed display={display} />;
    }
    if (!url) return <WIP isReady={false} />;

    return (
      <>
        <FeedDisplay display={display} talking={talking} />
        <RTCView streamURL={url} style={styles.viewer} />
      </>
    );
  };

  return (
    <View
      onLayout={handleLayout}
      style={[styles.container, talking && styles.talking, { width }]}
    >
      {question && <QuestionOverlay />}
      {renderContent()}
    </View>
  );
};
export default Feed;

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(255,255,255,.1)',
  },
  talking: {
    borderWidth: 2,
    borderColor: 'yellow',
  },
  viewer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,.1)',
    justifyContent: 'space-between',
  },
  select: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
