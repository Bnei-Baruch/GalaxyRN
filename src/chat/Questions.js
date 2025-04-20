import { StyleSheet, View, ScrollView } from 'react-native';
import { useChatStore } from '../zustand/chat';
import { Message } from './Message';
import { QuestionsForm } from './QuestionsForm';
import { useEffect, useRef } from 'react';


export const Questions = () => {
  const { questions, fetchQuestions } = useChatStore();
  const scrollViewRef = useRef(null);
  
  useEffect(() => {
    fetchQuestions();
  }, []);
  
  useEffect(() => {
    if (scrollViewRef.current && questions?.length > 0) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [questions]);
  
  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef}>
        {questions && questions.length > 0 ? questions.map(m => <Message key={m.time || Date.now()} msg={m} />) : null}
      </ScrollView>
      <QuestionsForm />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex           : 1,
  },
  form     : {
    direction: 'rtl',
    textAlign: 'right',
  }
});
