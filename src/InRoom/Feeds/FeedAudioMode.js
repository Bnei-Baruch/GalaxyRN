import React from 'react';
import { useInRoomStore } from '../../zustand/inRoom';
import FeedAudioModeView from './FeedAudioModeView';

const FeedAudioMode = ({ id }) => {
  const { feedById } = useInRoomStore();

  const feed = feedById[id];

  return (
    <FeedAudioModeView feed={feed} />
  );
};
export default FeedAudioMode;
