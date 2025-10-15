import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from '../../components/CustomText';
import { baseStyles } from '../../constants';

const FeedAudioModeView = ({ feed }) => {
  const { display: { display } = {}, talking, question } = feed || {};

  return (
    <View style={[styles.container, talking && styles.talking]}>
      {!talking && (
        <Icon name={'mic-off'} color={'red'} size={14} style={styles.icon} />
      )}
      {question && (
        <Icon
          name="question-mark"
          color={'red'}
          size={14}
          style={styles.icon}
        />
      )}
      <Text style={baseStyles.text} ellipsizeMode="tail" numberOfLines={1}>
        {display}
      </Text>
    </View>
  );
};

export default FeedAudioModeView;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222222B2',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignItems: 'center',
    textTransform: 'uppercase',
    width: '49%',
  },
  icon: {
    marginRight: 5,
  },
  talking: {
    borderWidth: 2,
    borderColor: 'yellow',
  },
});
