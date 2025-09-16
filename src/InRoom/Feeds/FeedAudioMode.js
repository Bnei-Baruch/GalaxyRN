import React from 'react';
import { useFeedsStore } from '../../zustand/feeds';
import FeedAudioModeView from './FeedAudioModeView';

const FeedAudioMode = ({ id }) => {
  const { feedById } = useFeedsStore();

  const feed = feedById[id];
  if (!feed) return null;

  return <FeedAudioModeView feed={feed} />;
};
export default FeedAudioMode;
