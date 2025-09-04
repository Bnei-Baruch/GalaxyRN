import React from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import WIP from '../../components/WIP';
import { baseStyles } from '../../constants';
import logger from '../../services/logger';
import { useShidurStore } from '../../zustand/shidur';
import { useUiActions } from '../../zustand/uiActions';

const NAMESPACE = 'RoomPortrait';

const RoomPortrait = ({ shidur, quads, members }) => {
  const { janusReady } = useShidurStore();
  const { setFeedsScrollY, toggleShowBars } = useUiActions();

  const handleAnyPress = () => {
    logger.debug(NAMESPACE, 'handleAnyPress');
    toggleShowBars(true);
  };

  const handleScroll = e => {
    const scrollY = e.nativeEvent.contentOffset.y;
    setFeedsScrollY(scrollY);
  };

  const { width } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        style={baseStyles.full}
        onScroll={handleScroll}
      >
        <Pressable onPress={handleAnyPress} style={styles.scrollContent}>
          <WIP isReady={janusReady}>
            <View style={[baseStyles.full, { width }]}>
              {shidur}
              {quads}
            </View>
          </WIP>
          {members}
        </Pressable>
      </ScrollView>
    </View>
  );
};
export default RoomPortrait;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    flexDirection: 'column',
  },
  scrollContent: {
    flex: 1,
    minHeight: '100%',
  },
});
