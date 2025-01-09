import React from 'react';
import { StyleSheet, ScrollView, View, TouchableWithoutFeedback } from 'react-native';
import { useInitsStore } from '../../zustand/inits';
import { baseStyles } from '../../constants';
import Feeds from '../Feeds/Feeds';
import { Shidurs } from '../../shidur/Shidurs';

const RoomFullscreen = ({ shidur, quads, members }) => {
  const { isPortrait } = useInitsStore();

  return (
    <View style={[styles.orientation, isPortrait ? styles.portrait : styles.landscape]}>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        style={baseStyles.full}
      >
        <TouchableWithoutFeedback onPress={handleAnyPress}>
          <View style={styles.scrollContent}>
            <Shidurs key="shidurs" />
            <Feeds key="members" />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};
export default RoomFullscreen;

const styles = StyleSheet.create({
  container    : {
    flex           : 1,
    backgroundColor: 'black',
    padding        : 10
  },
  orientation  : {
    flex    : 1,
    position: 'relative',
  },
  scrollContent: {
    flex     : 1,
    minHeight: '100%'
  },
  portrait     : { flexDirection: 'column' },
  landscape    : { flexDirection: 'row' },
});
