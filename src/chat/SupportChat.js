import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import  {show} from 'react-native-crisp-chat-sdk';
import { useCrispStore } from '../zustand/crisp';

const SupportChat = () => {
  const { start } = useCrispStore();
  useEffect(() => {
    start();
  }, []);


  return (
    <View>
      <Text>Support Chat</Text>
    </View>
  );
};

const styles = StyleSheet.create({

});

export default SupportChat; 