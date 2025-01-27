import { StyleSheet, View, ScrollView } from 'react-native';
import { useChatStore } from '../zustand/chat';
import { Message } from './Message';
import { QuestionsForm } from './QuestionsForm';

export const Questions = () => {
  const { questions } = useChatStore();
  return (
    <View>
      <ScrollView>
        {questions.map(m => <Message key={m.time} msg={m} />)}
      </ScrollView>
      <QuestionsForm />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    padding        : 20
  },
  form     : {
    direction: 'rtl',
    textAlign: 'right',
  }
});
