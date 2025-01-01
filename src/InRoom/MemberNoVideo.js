import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useInRoomStore } from '../zustand/inRoom';
import { feedWidth } from './helper';
import { useSettingsStore } from '../zustand/settings';

const MemberNoVideo = ({ id }) => {
  const { memberByFeed }  = useInRoomStore();
  const { numFeedsInCol } = useSettingsStore();

  const { display, talk } = memberByFeed[id];
  const width             = feedWidth(numFeedsInCol);

  return (
    <View style={[styles.container, { width }]}>
      <Icon name="point" color={talk ? 'red' : 'green'} size={20} />
      <Text>{display?.display}</Text>

    </View>
  );
};
export default MemberNoVideo;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222222B2',
  }
});
