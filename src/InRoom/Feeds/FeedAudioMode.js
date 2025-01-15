import React from 'react';
import { useInRoomStore } from '../../zustand/inRoom';
import FeedAudioModeView from './FeedAudioModeView';

const FeedAudioMode = ({ id }) => {
  const { feedById } = useInRoomStore();

  const { display, talk } = feedById[id];

  return (
    <FeedAudioModeView
      display={display?.display}
      talk={talk}
    />
  );
};
export default FeedAudioMode;
