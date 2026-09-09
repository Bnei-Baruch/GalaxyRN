import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import logger from '../../services/logger';
import { useSettingsStore } from '../../zustand/settings';
import { useUiActions } from '../../zustand/uiActions';

const NAMESPACE = 'KliOlamiFullscreen';
const KLI_OLAMI_ASPECT_RATIO = 16 / 9;

const KliOlamiFullscreen = ({ kliOlami }) => {
  const { toggleIsKliOlamiFullscreen } = useSettingsStore();
  const { toggleShowBars } = useUiActions();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    Orientation.lockToLandscape();

    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

  const handleClose = () => {
    toggleIsKliOlamiFullscreen();
    Orientation.unlockAllOrientations();
  };

  const handleAnyPress = () => {
    logger.debug(NAMESPACE, 'handleAnyPress');
    toggleShowBars(true, true);
  };

  let kliOlamiWidth = windowWidth;
  let kliOlamiHeight = windowWidth / KLI_OLAMI_ASPECT_RATIO;
  if (kliOlamiHeight > windowHeight) {
    kliOlamiHeight = windowHeight;
    kliOlamiWidth = windowHeight * KLI_OLAMI_ASPECT_RATIO;
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
          <View style={{ width: kliOlamiWidth, height: kliOlamiHeight }}>
            {kliOlami}
          </View>
        </Pressable>
      </View>
    </Modal>
  );
};
export default KliOlamiFullscreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
});
