import React from 'react';
import { StyleSheet, View } from 'react-native';
import MyRTCView from '../../components/MyRTCView';
import { useMyStreamStore } from '../../zustand/myStream';
import { useSettingsStore } from '../../zustand/settings';
import { useUiActions } from '../../zustand/uiActions';
import { useUserStore } from '../../zustand/user';
import CammutedFeed from './CammutedFeed';
import FeedDisplay from './FeedDisplay';
import QuestionOverlay from './QuestionOverlay';

const MyRoomMedia = () => {
  const { cammute, mute } = useMyStreamStore();
  const { question } = useSettingsStore();
  const { user } = useUserStore();
  const { width } = useUiActions();

  return (
    <View style={{ width }}>
      {!cammute && <FeedDisplay display={user.username} talking={!mute} />}
      <View style={styles.content}>
        {cammute ? <CammutedFeed display={user.username} /> : <MyRTCView />}

        {question && <QuestionOverlay />}
      </View>
    </View>
  );
};
export default MyRoomMedia;

const styles = StyleSheet.create({
  content: {
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,.1)',
  },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
