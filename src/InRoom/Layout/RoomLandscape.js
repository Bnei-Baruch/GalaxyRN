import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableWithoutFeedback } from 'react-native';
import { baseStyles } from '../../constants';
import WIP from '../../components/WIP';
import { useInRoomStore } from '../../zustand/inRoom';
import { useShidurStore } from '../../zustand/shidur';
import { memberItemWidth } from '../helper';
import { useSettingsStore } from '../../zustand/settings';

const RoomLandscape = ({ shidur, quads, members }) => {
  const { toggleShowBars } = useInRoomStore();
  const { janusReady }     = useShidurStore();
  const { setNumFeedsInCol } = useSettingsStore();

  const isShidur = !!shidur;

  useEffect(() => {
    setNumFeedsInCol(isShidur ? 2 : 3);
    return () => {
      setNumFeedsInCol();
    };

  }, [isShidur]);

  const handleAnyPress = () => toggleShowBars(true);

  return (
    <View style={styles.container}>
      {isShidur && (
        <WIP isReady={janusReady}>
          <View style={styles.shidurWrapper}>
            <View style={styles.shidur}>
              {shidur}
            </View>
          </View>
        </WIP>
      )
      }
      <View style={baseStyles.full}>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          style={baseStyles.full}
        >
          <TouchableWithoutFeedback onPress={handleAnyPress}>
            <View style={styles.scrollContent}>
              {quads}
              {members}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
    </View>
  );
};
export default RoomLandscape;

const styles = StyleSheet.create({
  container    : {
    flex           : 1,
    backgroundColor: 'black',
    flexDirection  : 'row'
  },
  scrollContent: {
    flex     : 1,
    minHeight: '100%'
  },
  shidurWrapper: {
    flex          : 1,
    height        : '100%',
    alignItems    : 'center',
    justifyContent: 'center',

  },
  shidur       : {
    width      : '100%',
    aspectRatio: memberItemWidth.getAspectRatio(true)
  }
});
