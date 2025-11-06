import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomBar } from '../bottomBar/BottomBar';
import ConnectionNotStable from '../components/ConnectionStatus/ConnectionNotStable';
import { TopBar } from '../topBar/TopBar';
import { useInRoomStore } from '../zustand/inRoom';
import ForegroundListener from './ForegroundListener';
import RoomLayout from './Layout/RoomLayout';

const Room = () => {
  const { exitRoom } = useInRoomStore();
  useEffect(() => {
    return () => {
      exitRoom();
    };
  }, []);

  return (
    <View style={styles.container}>
      <TopBar />
      <RoomLayout />
      <BottomBar />
      <ConnectionNotStable />
      <ForegroundListener />
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
