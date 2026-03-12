import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConnectionNotStable from '../components/ConnectionStatus/ConnectionNotStable';
import MyVideo from '../components/MyVideo';
import { baseStyles } from '../constants';
import { BottomBarLevel0 } from '../roomMenuLevel0/BottomBarLevel0';
import { TopBar } from '../roomMenuLevel0/TopBar';
import MenuLevel1 from '../roomMenuLevel1/MenuLevel1';
import logger from '../services/logger';
import { useInRoomStore } from '../zustand/inRoom';
import { useSettingsStore } from '../zustand/settings';
import ForegroundListener from './ForegroundListener';
import RoomLayout from './Layout/RoomLayout';

const Room = () => {
  const insets = useSafeAreaInsets();
  const { exitRoom } = useInRoomStore();
  const isPIPMode = useSettingsStore(state => state.isPIPMode);

  useEffect(() => {
    return () => {
      exitRoom();
    };
  }, []);

  if (isPIPMode) {
    logger.debug('Room', 'render MyRTCView');
    return <MyVideo styles={{ flex: 1, alignItems: 'start', backgroundColor: 'black' }} />;
  }

  return (
    <View
      style={[
        styles.container,
        baseStyles.viewBackground,
        { paddingTop: insets.top },
      ]}
    >
      <RoomLayout />
      <TopBar />
      <BottomBarLevel0 />
      <MenuLevel1 />
      <ConnectionNotStable />
      <ForegroundListener />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Room;
