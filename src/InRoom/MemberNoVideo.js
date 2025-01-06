import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useInRoomStore } from '../zustand/inRoom';
import { feedWidth } from './helper';
import { useSettingsStore } from '../zustand/settings';
import { baseStyles } from '../constants';

const MemberNoVideo = ({ id }) => {
  const { memberByFeed }  = useInRoomStore();
  const { numFeedsInCol } = useSettingsStore();

  const { display, talk } = memberByFeed[id];
  const width             = feedWidth(numFeedsInCol);

  return (
    <View style={[styles.container, { width }]}>
      <Icon
        name="circle"
        color={!talk ? 'red' : 'green'}
        size={7}
        style={styles.icon}
      />
      <Text
        style={baseStyles.text}
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {display?.display}
      </Text>

    </View>
  );
};
export default MemberNoVideo;

const styles = StyleSheet.create({
  container: {
    backgroundColor  : '#222222B2',
    flexDirection    : 'row',
    flexWrap         : 'nowrap',
    paddingVertical  : 10,
    paddingHorizontal: 20,
    borderWidth      : 1,
    alignItems       : 'center',
    textTransform    : 'uppercase',

  },
  icon     : {
    marginHorizontal: 5,
  }
});
