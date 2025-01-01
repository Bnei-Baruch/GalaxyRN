import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableWithoutFeedback } from 'react-native';
import { baseStyles } from '../../constants';
import WIP from '../../components/WIP';
import { useInRoomStore } from '../../zustand/inRoom';
import { useShidurStore } from '../../zustand/shidur';
import { memberItemWidth } from '../helper';
import { useSettingsStore } from '../../zustand/settings';

const RoomLandscape = ({ shidur, quads, members }) => {
  const { setShowBars }      = useInRoomStore();
  const { janusReady }       = useShidurStore();
  const { setNumFeedsInCol } = useSettingsStore();

  const isShidur = !!shidur;

  useEffect(() => {
    setNumFeedsInCol(isShidur ? 2 : 3);
    return () => {
      setNumFeedsInCol();
    };

  }, [isShidur]);

  const handleAnyPress = () => setShowBars(true);

  return (
    <View style={styles.container}>
      <WIP isReady={janusReady}>
        <View style={{ height: '100%', paddingVertical: 15 }}>
          <View style={shidur && styles.shidur}>
            {shidur}
          </View>
        </View>
      </WIP>
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
    padding        : 10,
    backgroundColor: 'black',
    flexDirection  : 'row'
  },
  scrollContent: {
    flex     : 1,
    minHeight: '100%'
  },
  shidur       : {
    height        : '100%',
    alignItems    : 'center',
    justifyContent: 'center',
    aspectRatio   : memberItemWidth.getAspectRatio()
  }
});
