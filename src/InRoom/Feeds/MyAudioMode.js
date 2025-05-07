import React from "react";
import FeedAudioModeView from "./FeedAudioModeView";
import { useUserStore } from "../../zustand/user";

const MyAudioMode = () => {
  const { user: { username: display, talking, question } = {} } =
    useUserStore();
  const feed = { display: { display }, talking, question };
  return <FeedAudioModeView feed={feed} />;
};
export default MyAudioMode;
