import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import React, { useRef, useEffect, useCallback } from 'react';
import { useInRoomStore, activateFeedsVideos, deactivateFeedsVideos } from '../../zustand/inRoom';
import { useSettingsStore } from '../../zustand/settings';
import { feedWidth } from '../helper';
import { useUiActions } from '../../zustand/uiActions';
import CammutedFeed from './CammutedFeed';
import FeedDisplay from './FeedDisplay';

const SCROLL_STEP = 20;

const Feed = ({ id }) => {
  const { feedById }               = useInRoomStore();
  const { numFeedsInCol }          = useSettingsStore();
  const { feedsScrollY, feedsPos } = useUiActions();

  const feed                                              = feedById[id];
  const { display: { display } = {}, url, talking, vMid } = feed || {};

  const ref = useRef({ prevScrollY: 0, isOn: !!url });

  const scrollPos     = Math.round((feedsScrollY - feedsPos) / SCROLL_STEP) * SCROLL_STEP;
  const hideShowVideo = useCallback(() => {
    if (!ref.current)
      return;

    const { height, y, prevScrollY, isOn } = ref.current;

    if (!height)
      return;

    //when scroll up dir > 0, when scroll down dir < 0
    const dir = scrollPos - prevScrollY;
    if (dir === 0)
      return;

    const screenHeight = Dimensions.get('window').height;
    if (y + height - SCROLL_STEP < scrollPos && y + height + 2 * SCROLL_STEP > scrollPos) {
      //when feed is near top screen border
      if (dir > 0) {
        console.log('show hide on rotation: deactivateFeedsVideos top');
        isOn && deactivateFeedsVideos([feed]);
        ref.current.isOn = false;
      } else {
        console.log('show hide on rotation: activateFeedsVideos top');
        !isOn && activateFeedsVideos([feed]);
        ref.current.isOn = true;
      }
    } else if (scrollPos + screenHeight > y - 2 * SCROLL_STEP && scrollPos + screenHeight < y + SCROLL_STEP) {
      //when feed is near bottom screen border
      if (dir > 0) {
        !isOn && activateFeedsVideos([feed]);
        ref.current.isOn = true;
      } else {
        isOn && deactivateFeedsVideos([feed]);
        ref.current.isOn = false;
      }
    }
    ref.current.prevScrollY = scrollPos;
  }, [scrollPos, feed]);

  useEffect(() => {
    hideShowVideo();
  }, [hideShowVideo]);

  if (!feed)
    return null;

  //on block position change or phone rotation
  const handleLayout = (event) => {
    const { y, height } = event.nativeEvent.layout;
    let isOn            = !!feed.url;

    const screenHeight = Dimensions.get('window').height;

    if (feed.display.display === 'davgur') {
      console.group('show hide on rotation: handleLayout');
      console.log('isOn', isOn);
      console.log('y', y);
      console.log('height', height);
      console.log('scrollPos', scrollPos);
      console.log('y + height', y + height);
      console.log('scrollPos + screenHeight', scrollPos + screenHeight);
      console.groupEnd();
    }
    if (y + height - SCROLL_STEP > scrollPos && y < scrollPos + screenHeight - SCROLL_STEP) {
      !isOn && activateFeedsVideos([feed]);
      isOn = true;
    } else {
      isOn && deactivateFeedsVideos([feed]);
      isOn = false;
    }
    ref.current = { y, height, prevScrollY: scrollPos, isOn };
  };

  const width         = feedWidth(numFeedsInCol);
  const renderContent = () => {
    if (vMid) {
      return (
        <>
          <FeedDisplay display={display} />
          <RTCView
            streamURL={url}
            style={styles.viewer}
          />
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
  container  : {
    aspectRatio: 16 / 9,
  },
  talking    : {
    borderWidth: 2,
    borderColor: 'yellow'
  },
  viewer     : {
    flex           : 1,
    backgroundColor: 'black',
    justifyContent : 'space-between',
  },
  select     : {
    padding       : 24,
    flexDirection : 'row',
    justifyContent: 'space-between',
  },
  overlay    : {
    backgroundColor: 'black',
    aspectRatio    : 16 / 9,
    alignItems     : 'center',
    justifyContent : 'center'
  }
});
