import React from 'react';
import { useInRoomStore } from '../../zustand/inRoom';
import FeedAudioModeView from './FeedAudioModeView';

const FeedAudioMode = ({ id }) => {
  const { feedById } = useInRoomStore();

  const feed = feedById[id];
  const { display, talk, question }  =feed;

  return (
    <FeedAudioModeView
      display={display?.display}
      talk={talk}
      question={question}
    />
  );
};
export default FeedAudioMode;
