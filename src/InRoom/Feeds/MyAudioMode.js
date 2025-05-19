import React from "react";
import FeedAudioModeView from "./FeedAudioModeView";
import { useUserStore } from "../../zustand/user";
import { useMyStreamStore } from "../../zustand/myStream";
const MyAudioMode = () => {
  const { user: { username: display, question } = {} } =
    useUserStore();
  const { mute } = useMyStreamStore();
  const feed = { display: { display }, talking: mute, question };
  return <FeedAudioModeView feed={feed} />;
};
export default MyAudioMode;
