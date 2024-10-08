import React, { useEffect, useState, useRef } from 'react';
import { useSettingsStore } from '../zustand/settings';
import { StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { getUserMedia } from '../shared/tools';

const MyRTCView = () => {
  const { muted, cammuted } = useSettingsStore();

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [stream, setStream]                 = useState(null);

  const videoRef      = useRef(null);
  const audioTrackRef = useRef(null);
  const videoTrackRef = useRef(null);

  useEffect(() => {
    if (!stream) {
      getUserMedia().then(s => {
        setStream(s);
        audioTrackRef.current = s.getAudioTracks()[0];
        videoTrackRef.current = s.getVideoTracks()[0];
      });
    }

    return () => {
      if (stream) {
        //stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (audioTrackRef.current) {
      audioTrackRef.current.enabled = !isAudioEnabled;
      setIsAudioEnabled(!isAudioEnabled);
    }
  }, [muted]);

  useEffect(() => {
    if (videoTrackRef.current) {
      videoTrackRef.current.enabled = !isVideoEnabled;
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [cammuted]);

  return (
    <RTCView
      streamURL={stream?.toURL()}
      style={styles.video}
      objectFit="cover"
      mirror={true}
    />
  );
};
export default MyRTCView;

const styles = StyleSheet.create({
  video: {
    position: 'absolute',
    top     : 0,
    left    : 0,
    bottom  : 0,
    right   : 0,
  },
});
