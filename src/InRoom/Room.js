import React, { useEffect } from 'react';
import { useInRoomStore } from '../zustand/inRoom';
import { StyleSheet, View } from 'react-native';
import { ChatModal } from '../chat/ChatModal';
import { BottomBar } from '../bottomBar/BottomBar';
import { TopBar } from '../topBar/TopBar';
import RoomLayout from './Layout/RoomLayout';

const Room = () => {
  const { joinRoom, exitRoom } = useInRoomStore();
  useEffect(() => {
    joinRoom();
    return () => {
      exitRoom();
    };
  }, []);

  return (
    <View style={styles.container}>
      <TopBar />
      <RoomLayout />
      <BottomBar />
      <ChatModal />
    </View>
  );
};
export default Room;

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: 'black',
  }
});
