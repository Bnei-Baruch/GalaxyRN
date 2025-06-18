import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { useSettingsStore } from '../../zustand/settings';

const RoomFullscreen = ({ shidur }) => {
  const { toggleIsFullscreen } = useSettingsStore();

  useEffect(() => {
    Orientation.lockToLandscape();

    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

  const handleClose = () => {
    toggleIsFullscreen();
    Orientation.unlockAllOrientations();
  };

  return (
    <Modal
      visible={true}
      onRequestClose={handleClose}
      animationType="none"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      supportedOrientations={['landscape']}
    >
      <View style={styles.container}>
        <View style={styles.shidur}>{shidur}</View>
      </View>
    </Modal>
  );
};
export default RoomFullscreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  shidur: {
    flex: 1,
    height: '100%',
    aspectRatio: 16 / 9,
  },
});
