import { StyleSheet, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import React, { useRef, useEffect } from 'react';
import { useInRoomStore, activateFeedsVideos, deactivateFeedsVideos } from '../../zustand/inRoom';
import { useSettingsStore } from '../../zustand/settings';
import { feedWidth } from '../helper';
import { useUiActions } from '../../zustand/uiActions';
import CammutedFeed from './CammutedFeed';
import FeedDisplay from './FeedDisplay';
import WIP from '../../components/WIP';

const Feed = ({ id }) => {
  const { feedById }      = useInRoomStore();
  const { numFeedsInCol } = useSettingsStore();
  const { borders }       = useUiActions();

  const feed                                              = feedById[id];
  const { display: { display } = {}, url, talking, vMid } = feed || {};

  const ref = useRef();

  const activateDeactivate = (top = 0, bottom = 0, feed) => {
    if (!ref.current || !feed)
      return;

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

  if (!feed)
    return null;

  const handleLayout = (event) => {
    const { y, height } = event.nativeEvent.layout;
    let isOn            = !!feed.url;
    ref.current         = { y, height, isOn };
    activateDeactivate(borders.top, borders.bottom, feed);
  };

  const width         = feedWidth(numFeedsInCol);
  const renderContent = () => {
    if (vMid) {
      return (
        <>
          <FeedDisplay display={display} />
          <WIP isReady={!(ref.current?.isOn && !feed.url)}>
            <RTCView
              streamURL={url}
              style={styles.viewer}
            />
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
      {renderContent()}
    </View>
  );
};
export default Feed;

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    //marginVertical: 100
  },
  talking  : {
    borderWidth: 2,
    borderColor: 'yellow'
  },
  viewer   : {
    flex           : 1,
    backgroundColor: 'black',
    justifyContent : 'space-between'
  },
  select   : {
    padding       : 24,
    flexDirection : 'row',
    justifyContent: 'space-between',
  },
  overlay  : {
    backgroundColor: 'black',
    aspectRatio    : 16 / 9,
    alignItems     : 'center',
    justifyContent : 'center'
  }
});
