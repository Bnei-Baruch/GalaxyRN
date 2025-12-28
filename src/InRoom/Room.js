import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoomMenuLevel0 } from '../roomMenuLevel0/RoomMenuLevel0';
import Menu from '../roomMenuLevel1/Menu';
import ConnectionNotStable from '../components/ConnectionStatus/ConnectionNotStable';
import { baseStyles } from '../constants';
import { useInRoomStore } from '../zustand/inRoom';
import ForegroundListener from './ForegroundListener';
import RoomLayout from './Layout/RoomLayout';

const Room = () => {
  const insets = useSafeAreaInsets();
  const { exitRoom } = useInRoomStore();

  useEffect(() => {
    return () => {
      exitRoom();
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        baseStyles.viewBackground,
        { paddingTop: insets.top },
      ]}
    >
      <RoomLayout />
      <RoomMenuLevel0 />
      <Menu />
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
