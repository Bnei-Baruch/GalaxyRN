import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import logger from '../../services/logger';
import { useSettingsStore } from '../../zustand/settings';
import { useUiActions } from '../../zustand/uiActions';

const NAMESPACE = 'RoomFullscreen';
const SHIDUR_ASPECT_RATIO = 16 / 9;

const RoomFullscreen = ({ shidur }) => {
  const { toggleIsFullscreen } = useSettingsStore();
  const { toggleShowBars } = useUiActions();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

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

  const handleAnyPress = () => {
    logger.debug(NAMESPACE, 'handleAnyPress');
    toggleShowBars(true, true);
  };

  let shidurWidth = windowWidth;
  let shidurHeight = windowWidth / SHIDUR_ASPECT_RATIO;
  if (shidurHeight > windowHeight) {
    shidurHeight = windowHeight;
    shidurWidth = windowHeight * SHIDUR_ASPECT_RATIO;
  }

  return (
    <Modal
      visible={true}
      onRequestClose={handleClose}
      animationType="none"
      presentationStyle="fullScreen"
      supportedOrientations={['landscape']}
    >
      <View style={styles.container}>
        <Pressable onPress={handleAnyPress}>
          <View style={{ width: shidurWidth, height: shidurHeight }}>
            {shidur}
          </View>
        </Pressable>
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
});
