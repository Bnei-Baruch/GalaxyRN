import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useChatStore, chatModes } from '../zustand/chat';

const ScreenTitle = ({ text }) => {
  const { mode, setChatMode } = useChatStore();

  const handleExit = () => setChatMode(chatModes.close);
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Arvut - Virtual Ten</Text>
      <Text style={styles.title}>{text}</Text>
      <TouchableOpacity onPress={handleExit} style={styles.exit}>
        <Icon name="navigate-next" size={30} color="black" />
      </TouchableOpacity>
    </View>
  );
};
export default ScreenTitle;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  header   : {
    fontSize: 13
  },
  text     : {
    fontSize  : 14,
    fontWeight: 'bold'
  },
  exit     : {
    position: 'absolute',
    right   : 5,
    top     : 5
  }
});

