import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import WIP from '../../components/WIP';
import logger from '../../services/logger';
import {
  activateFeedsVideos,
  deactivateFeedsVideos,
  useInRoomStore,
} from '../../zustand/inRoom';
import { useUiActions } from '../../zustand/uiActions';
import CammutedFeed from './CammutedFeed';
import FeedDisplay from './FeedDisplay';
import QuestionOverlay from './QuestionOverlay';

const NAMESPACE = 'Feed';

const Feed = ({ id }) => {
  const { feedById } = useInRoomStore();
  const { borders, width } = useUiActions();

  const feed = feedById[id];
  const {
    display: { display } = {},
    url,
    talking,
    camera,
    question,
  } = feed || {};
  logger.debug(NAMESPACE, 'Feed', feed);

  const ref = useRef();

  const activateDeactivate = (top = 0, bottom = 0, feed) => {
    if (!ref.current || !feed) return;

    const { height, y, isOn } = ref.current;
    if (y + height - 10 > top && y - 10 < bottom) {
      if (isOn) return;
      activateFeedsVideos([feed]);
      ref.current.isOn = true;
    } else {
      if (!isOn) return;
      deactivateFeedsVideos([feed]);
      ref.current.isOn = false;
    }
  };

  useEffect(() => {
    const { top, bottom } = borders;
    activateDeactivate(top, bottom, feed);
  }, [borders, feed]);

  if (!feed) return null;

  const handleLayout = event => {
    const { y, height } = event.nativeEvent.layout;
    let isOn = !!feed.url;
    ref.current = { y, height, isOn };
    activateDeactivate(borders.top, borders.bottom, feed);
  };

  const renderContent = () => {
    if (camera) {
      return (
        <>
          <FeedDisplay display={display} talking={talking} />
          <WIP isReady={!(ref.current?.isOn && !feed.url)}>
            <RTCView streamURL={url} style={styles.viewer} />
          </WIP>
        </>
      );
    }
    return <CammutedFeed display={display} />;
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
