import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { feedWidth } from '../helper';
import { useSettingsStore } from '../../zustand/settings';
import { baseStyles } from '../../constants';

const FeedAudioModeView = ({ display, talk = false }) => {
  const { numFeedsInCol } = useSettingsStore();
  const width             = feedWidth(numFeedsInCol);

  return (
    <View style={[styles.container, talk && styles.talking, { width }]}>
      <Icon
        name="circle"
        color={'red'}
        size={7}
        style={styles.icon}
      />
      <Text
        style={baseStyles.text}
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {display}
      </Text>

    </View>
  );
};
export default FeedAudioModeView;

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
  },
  talking  : {
    borderWidth: 2,
    borderColor: 'yellow'
  }
});
