import React from 'react';
import FeedAudioModeView from './FeedAudioModeView';
import { useUserStore } from '../../zustand/user';

const MyAudioMode = () => {
  const { user } = useUserStore();

  return <FeedAudioModeView display={user.username} />;
};
export default MyAudioMode;
