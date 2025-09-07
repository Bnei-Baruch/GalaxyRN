import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomBar } from '../bottomBar/BottomBar';
import { TopBar } from '../topBar/TopBar';

import RoomLayout from './Layout/RoomLayout';

import { useInRoomStore } from '../zustand/inRoom';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
});

export default Room;
