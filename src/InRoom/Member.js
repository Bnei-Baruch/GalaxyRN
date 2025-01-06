import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import React, { useRef, useEffect, useCallback } from 'react';
import { useInRoomStore, activateFeedsVideos, deactivateFeedsVideos } from '../zustand/inRoom';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../zustand/settings';
import { feedWidth } from './helper';
import { useUiActions } from '../zustand/uiActions';

const SCROLL_STEP = 20;

const Member = ({ id }) => {
  const { memberByFeed }           = useInRoomStore();
  const { numFeedsInCol }          = useSettingsStore();
  const { feedsScrollY, feedsPos } = useUiActions();

  const feed             = memberByFeed[id];
  const { display, url } = feed;
  const ref              = useRef({ prevScrollY: 0, isOn: !!url });

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

  const width = feedWidth(numFeedsInCol);
  return (
    <View
      onLayout={handleLayout}
      style={[styles.container, { width }]}
    >
      <View style={styles.display}>
        <Text style={styles.displayMark}>.</Text>
        <Text style={styles.displayText}>{display?.display}</Text>
      </View>
      {
        url ? (
          <RTCView
            streamURL={url}
            style={styles.viewer}
          />
        ) : (
          <View style={styles.overlay}>
            <Icon name="account-circle" size={80} color="white" />
          </View>
        )
      }
    </View>
  );
};
export default Member;

const styles = StyleSheet.create({
  container  : {
    backgroundColor: '#eaeaea',
  },
  display    : {
    position       : 'absolute',
    left           : 0,
    top            : 0,
    backgroundColor: 'rgba(34, 34, 34, .7)',
    flexDirection  : 'row',
    flexWrap       : 'wrap',
    padding        : 4,
    zIndex         : 1
  },
  displayMark: {
    color       : 'red',
    fontSize    : 30,
    lineHeight  : 18,
    paddingRight: 5
  },
  displayText: {
    color: 'white',
  },
  viewer     : {
    aspectRatio    : 16 / 9,
    backgroundColor: 'black',
    justifyContent : 'space-between',
  },
  select     : {
    padding       : 24,
    flexDirection : 'row',
    justifyContent: 'space-between',
  },
  overlay    : {
    backgroundColor: 'grey',
    aspectRatio    : 16 / 9,
    alignItems     : 'center',
    justifyContent : 'center'
  }
});
