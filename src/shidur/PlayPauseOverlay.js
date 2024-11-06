import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useShidurStore } from '../zustand/shidur';

export const PlayPauseOverlay = () => {
  const { toggleIsPlay } = useShidurStore();

  return (
    <View onPress={toggleIsPlay} style={styles.container}>
      <Icon name="play-circle-outline" size={70} color="white" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width         : '100%',
    alignItems    : 'center',
    justifyContent: 'center',
    aspectRatio   : 16 / 9,
  }
});
