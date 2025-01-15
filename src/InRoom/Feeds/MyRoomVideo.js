import React from 'react';
import { View, StyleSheet } from 'react-native';
import MyRTCView from '../../components/MyRTCView';
import { useMyStreamStore } from '../../zustand/myStream';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../../zustand/settings';
import { feedWidth } from '../helper';
import FeedDisplay from './FeedDisplay';
import { useUserStore } from '../../zustand/user';

const MyRoomMedia = () => {
  const { cammute }                 = useMyStreamStore();
  const { numFeedsInCol, question } = useSettingsStore();
  const { user }                    = useUserStore();

  const width = feedWidth(numFeedsInCol);
  return (
    <View style={{ width }}>
      <FeedDisplay display={user.username} />
      <View style={styles.content}>
        {
          cammute ? (
            <View style={styles.overlay}>
              <Icon name="account-circle" size={80} color="white" />
            </View>
          ) : <MyRTCView />
        }

        {
          question && (
            <View style={styles.questionContainer}>
              <Icon
                name="question-mark"
                size={40}
                color="white"
                style={styles.question}
              />
            </View>
          )
        }
      </View>
    </View>
  );
};
export default MyRoomMedia;

const styles = StyleSheet.create({
  content          : {
    aspectRatio    : 16 / 9,
    alignItems     : 'center',
    justifyContent : 'center',
    backgroundColor: 'black'
  },
  overlay          : {
    alignItems    : 'center',
    justifyContent: 'center'
  },
  questionContainer: {
    flex          : 1,
    position      : 'absolute',
    alignItems    : 'center',
    justifyContent: 'center'
  },
  question         : {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding        : 10,
    borderRadius   : 10,
    borderColor    : 'white',
    borderWidth    : 2
  }
});
