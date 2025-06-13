import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomBar } from '../bottomBar/BottomBar';
import { TopBar } from '../topBar/TopBar';
import { useInRoomStore } from '../zustand/inRoom';
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
    </View>
  );
};
export default Room;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});
