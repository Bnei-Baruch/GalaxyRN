import React from 'react';
import { StyleSheet, ScrollView, View, TouchableWithoutFeedback } from 'react-native';

import { useInRoomStore } from '../../zustand/inRoom';
import { useShidurStore } from '../../zustand/shidur';
import { baseStyles } from '../../constants';
import WIP from '../../components/WIP';
import { useUiActions } from '../../zustand/uiActions';

const RoomPortrait = ({ shidur, quads, members }) => {
  const { janusReady }     = useShidurStore();
  const { setFeedsScrollY, toggleShowBars } = useUiActions();

  const handleAnyPress = () => toggleShowBars(true);

  const handleScroll = e => setFeedsScrollY(e.nativeEvent.contentOffset.y);

  return (
    <View style={styles.container}>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        style={baseStyles.full}
        onScroll={handleScroll}
      >
        <TouchableWithoutFeedback onPress={handleAnyPress}>
          <View style={styles.scrollContent}>
            <WIP isReady={janusReady}>
              <View style={baseStyles.full}>
                {shidur}
                {quads}
              </View>
            </WIP>
            {members}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};
export default RoomPortrait;

const styles = StyleSheet.create({
  container    : {
    flex         : 1,
    position     : 'relative',
    flexDirection: 'column'
  },
  scrollContent: {
    flex     : 1,
    minHeight: '100%'
  }
});
