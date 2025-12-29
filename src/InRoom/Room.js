import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuLevel0 } from '../roomMenuLevel0/MenuLevel0';
import MenuLevel1 from '../roomMenuLevel1/MenuLevel1';
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
      <MenuLevel0 />
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
