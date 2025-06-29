import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import WIP from '../../components/WIP';
import { baseStyles } from '../../constants';
import { useShidurStore } from '../../zustand/shidur';
import { useUiActions } from '../../zustand/uiActions';

const RoomPortrait = ({ shidur, quads, members }) => {
  const { janusReady } = useShidurStore();
  const { setFeedsScrollY, toggleShowBars } = useUiActions();

  const handleAnyPress = () => toggleShowBars(true);

  const handleScroll = e => setFeedsScrollY(e.nativeEvent.contentOffset.y);

  const { width } = Dimensions.get('window');

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
              <View style={[baseStyles.full, { width }]}>
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
