import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { baseStyles } from '../../constants';

const FeedAudioModeView = ({ feed }) => {
  const { display: { display } = {}, talking, question } = feed || {};
  
  return (
  <View style={[styles.container, talking && styles.talking]}>
    <Icon
      name="circle"
      color={'red'}
      size={7}
      style={styles.icon}
    />
    {
      question && (
        <Icon
          name="question-mark"
          color={'red'}
          size={7}
          style={styles.icon}
        />
      )
    }
    <Text
      style={baseStyles.text}
      ellipsizeMode="tail"
      numberOfLines={1}
    >
      {display}
    </Text>

  </View>
);}

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
    width            : '49%'

  },
  icon     : {
    marginHorizontal: 5,
  },
  talking  : {
    borderWidth: 2,
    borderColor: 'yellow'
  }
});
