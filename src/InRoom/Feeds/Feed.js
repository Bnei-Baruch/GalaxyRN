import React, { memo, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import logger from '../../services/logger';

import WIP from '../../components/WIP';
import { withProfiler } from '../../libs/sentry/sentryHOC';
import { useFeedsStore } from '../../zustand/feeds';
import { useSettingsStore } from '../../zustand/settings';
import { useUiActions } from '../../zustand/uiActions';
import CammutedFeed from './CammutedFeed';
import FeedDisplay from './FeedDisplay';

import QuestionOverlay from './QuestionOverlay';

const NAMESPACE = 'Feed';

const RTCViewWrapper = memo(
  ({ streamURL }) => {
    logger.debug(NAMESPACE, 'RTCViewWrapper render');
    return <RTCView streamURL={streamURL} style={styles.rtcView} />;
  },
  (prevProps, nextProps) => {
    return prevProps.streamURL === nextProps.streamURL;
  }
);

const Feed = ({ id }) => {
  const feed = useFeedsStore(state => state.feedById[id]);
  const { activateFeedsVideos, deactivateFeedsVideos } = useFeedsStore();
  const { borders, width } = useUiActions();
  const netWIP = useSettingsStore(state => state.netWIP);

  logger.debug(NAMESPACE, 'Feed render');

  const {
    display: { display } = {},
    talking,
    camera,
    question,
    vOn,
    url,
  } = feed || {};

  const ref = useRef();

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

  const handleLayout = event => {
    const { y, height } = event.nativeEvent.layout;
    ref.current = { y, height };
    activateDeactivate(borders.top, borders.bottom, id);
  };

  const renderContent = () => {
    if (netWIP) {
      return <WIP isReady={false} />;
    }

    if (!camera) {
      return <CammutedFeed display={display} />;
    }
    if (!vOn || !url) return <WIP isReady={false} />;

    return (
      <View style={styles.viewer}>
        <FeedDisplay display={display} talking={talking} />
        <RTCViewWrapper streamURL={url} />
      </View>
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

export default withProfiler(Feed, { name: 'Feed' });

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
  },
  rtcView: {
    flex: 1,
  },
  select: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
