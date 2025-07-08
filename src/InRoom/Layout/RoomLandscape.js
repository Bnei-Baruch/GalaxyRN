import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { baseStyles } from '../../constants';
import { useUiActions } from '../../zustand/uiActions';

const RoomLandscape = ({ shidur, quads, members, subtitle }) => {
  const { setFeedsScrollY, width, toggleShowBars } = useUiActions();

  const isShidur = !!shidur;

  const handleAnyPress = () => toggleShowBars(true);
  const handleScroll = e => {
    const scrollY = e.nativeEvent.contentOffset.y;
    setFeedsScrollY(scrollY);
  };
  return (
    <View style={styles.container}>
      {isShidur && (
        <View style={styles.shidurWrapper}>
          <View style={styles.shidur}>{shidur}</View>
          {subtitle}
        </View>
      )}
      <View style={isShidur ? { width: width * 2 } : baseStyles.full}>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          style={baseStyles.full}
          onScroll={handleScroll}
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
  container: {
    flex: 1,
    backgroundColor: 'black',
    flexDirection: 'row',
  },
  scrollContent: {
    flex: 1,
    minHeight: '100%',
  },
  shidurWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  shidur: {
    width: '100%',
  },
});
