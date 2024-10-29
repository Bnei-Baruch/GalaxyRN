import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useShidurStore } from '../zustand/shidur';
import { PlayPauseBtn } from './PlayPauseBtn';
import { OptionsBtn } from './OptionsBtn';

export const Shidur = () => {
  const { videoUrl, initShidur, ready, toggleTalking, talking, cleanShidur } = useShidurStore();

  useEffect(() => {
    initShidur();
    return () => {
      cleanShidur();
    };
  }, []);

  return (
    <View style={styles.container}>
      {
        ready ? (
          <RTCView
            streamURL={videoUrl}
            style={styles.viewer}
          />
        ) : <Text>still not ready</Text>
      }

      <View style={styles.toolbar}>
        <PlayPauseBtn />
        <OptionsBtn />
      </View>
      <Button
        title="toggle on air"
        onPress={toggleTalking}
        style={{ backgroundColor: talking ? 'red' : 'green' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red',
  },
  viewer   : {
    aspectRatio    : 16 / 9,
    height         : 'auto',
    backgroundColor: 'black',
    justifyContent : 'center',
    alignItems     : 'center',
  },
  toolbar  : {
    padding       : 4,
    flexDirection : 'row',
    justifyContent: 'space-between',
  },
  video    : {
    // flex:2
  },
  audio    : {
    marginRight: 1,
  },
});
