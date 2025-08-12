import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomBar } from '../bottomBar/BottomBar';
import {
  initConnectionMonitor,
  removeConnectionMonitor,
} from '../libs/connection-monitor';
import logger from '../services/logger';
import { TopBar } from '../topBar/TopBar';
import { useInRoomStore } from '../zustand/inRoom';
import RoomLayout from './Layout/RoomLayout';

const NAMESPACE = 'Room';

const Room = () => {
  const { joinRoom, exitRoom } = useInRoomStore();

  useEffect(() => {
    const init = async () => {
      try {
        initConnectionMonitor();
        logger.debug(NAMESPACE, 'Initializing room');
        await joinRoom();
      } catch (error) {
        logger.error(NAMESPACE, 'Error joining room:', error);
      }
    };

    init();

    return () => {
      logger.debug(NAMESPACE, 'Cleaning up room');
      removeConnectionMonitor();
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
