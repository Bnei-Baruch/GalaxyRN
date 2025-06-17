import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const QuestionOverlay = () => {
  return (
    <View style={styles.questionContainer}>
      <Icon
        name="question-mark"
        size={40}
        color="white"
        style={styles.question}
      />
    </View>
  );
};

export default QuestionOverlay;

const styles = StyleSheet.create({
  questionContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  question: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
    borderColor: 'white',
    borderWidth: 2,
  },
});
