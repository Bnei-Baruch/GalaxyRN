import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { baseStyles } from '../../constants';
import logger from '../../services/logger';
import { useUiActions } from '../../zustand/uiActions';

const NAMESPACE = 'RoomLandscape';

const RoomLandscape = ({ shidur, quads, members, subtitle }) => {
  const { setFeedsScrollY, width, toggleShowBars } = useUiActions();

  const isShidur = !!shidur;

  const handleAnyPress = () => {
    logger.debug(NAMESPACE, 'handleAnyPress');
    toggleShowBars(true);
  };
  const handleScroll = e => {
    const scrollY = e.nativeEvent.contentOffset.y;
    setFeedsScrollY(scrollY);
  };
  return (
    <Pressable onPress={handleAnyPress} style={styles.container}>
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
          <View style={styles.scrollContent}>
            {quads}
            {members}
          </View>
        </ScrollView>
      </View>
    </Pressable>
  );
};
export default RoomLandscape;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    flexDirection: 'row',
    alignItems: 'flex-start',
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
