import React, { useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { useSettingsStore } from '../../zustand/settings';
import { useUiActions } from '../../zustand/uiActions';

const RoomFullscreen = ({ shidur }) => {
  const { toggleIsFullscreen } = useSettingsStore();
  const { toggleShowBars } = useUiActions();

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

  const handleAnyPress = () => toggleShowBars(true);

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
        <TouchableWithoutFeedback onPress={handleAnyPress}>
          <View style={styles.shidur}>{shidur}</View>
        </TouchableWithoutFeedback>
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
