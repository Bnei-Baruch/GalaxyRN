import * as React from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useShidurStore } from '../zustand/shidur';

export const PlayPauseOverlay = () => {
  const { toggleIsPlay } = useShidurStore();
  const handleToggleIsPlay = () => toggleIsPlay();

  return (
    <TouchableWithoutFeedback onPress={handleToggleIsPlay}>
      <View style={styles.container}>
        <Icon name="play-circle-outline" size={70} color="white" />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
  },
});
