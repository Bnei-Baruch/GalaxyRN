import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useShidurStore } from '../zustand/shidur';

export const Quads = () => {
  const { quadUrl, initQuad, cleanQuads } = useShidurStore();

  useEffect(() => {
    initQuad();
    return () => {
      cleanQuads();
    };
  }, []);

  return (
    <View style={styles.container}>
      {quadUrl && (
        <RTCView
          streamURL={quadUrl}
          style={styles.viewer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems    : 'center',
    width         : '100%',
    justifyContent: 'center'
  },
  viewer   : {
    aspectRatio   : 16 / 9,
    width         : '100%',
    justifyContent: 'center',
    alignItems    : 'center',
  }
});
