import { View, StyleSheet, Text } from "react-native";


import { useChatStore } from "../zustand/chat";

export const ChatCounter = () => {
  const {  chatNewMsgs} = useChatStore();
  
  if(chatNewMsgs <= 0)
    return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{chatNewMsgs}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red',
    height: 20,
    width: 20,
    borderRadius: 10,
    textAlign: 'center',
    position: 'absolute',
    top: -5,
    right: -5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 20,
  },  
});
