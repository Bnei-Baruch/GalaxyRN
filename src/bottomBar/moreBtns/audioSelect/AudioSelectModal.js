import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  dualLanguageOptions,
  sourceStreamOptions,
  workShopOptions,
} from '../../../consts';
import logger from '../../../services/logger';
import { useShidurStore } from '../../../zustand/shidur';
import AudioHeader from './AudioHeader';
import AudioOption from './AudioOption';

const NAMESPACE = 'AudioSelectModal';

const AudioSelectModal = () => {
  const { setAudio, isAudioSelectOpen, setIsAudioSelectOpen } =
    useShidurStore();

  const handleSetAudio = key => {
    logger.debug(NAMESPACE, 'handleSetAudio', key);
    setAudio(key);
    setIsAudioSelectOpen(false);
  };

  const handleClose = () => {
    logger.debug(NAMESPACE, 'handleClose');
    setIsAudioSelectOpen(false);
  };
  logger.debug(NAMESPACE, 'isAudioSelectOpen', isAudioSelectOpen);

  return (
    <Modal
      animationType="fade"
      presentationStyle="overFullScreen"
      visible={isAudioSelectOpen}
      onRequestClose={handleClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent} pointerEvents="auto">
          <TouchableOpacity onPress={handleClose} style={styles.close}>
            <Icon name="close" size={30} color="white" />
          </TouchableOpacity>
          <ScrollView
            style={styles.scrollView}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <AudioHeader
              icon="group"
              text="shidur.streamForWorkshop"
              description="shidur.streamForWorkshopDescription"
            />
            {workShopOptions.map(x => (
              <AudioOption
                key={x.key}
                streamKey={x.key}
                icon="group"
                text={x.text}
                onSelect={handleSetAudio}
              />
            ))}
            <View style={styles.sectionDivider} />
            <AudioHeader
              icon="center-focus-strong"
              text="shidur.sourceStream"
              description="shidur.sourceStreamDescription"
            />
            {sourceStreamOptions.map(x => (
              <AudioOption
                key={x.key}
                streamKey={x.key}
                icon="center-focus-strong"
                text={x.text}
                onSelect={handleSetAudio}
              />
            ))}
            <View style={styles.sectionDivider} />
            <AudioHeader
              icon="group"
              text="shidur.dualLnaguagesStream"
              description="shidur.dualLnaguagesStreamDescription"
            />
            {dualLanguageOptions.map(x => (
              <AudioOption
                key={x.key}
                streamKey={x.key}
                icon="group"
                text={x.text}
                onSelect={handleSetAudio}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    height: '90%',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#1c1c1c',
    borderRadius: 5,
    padding: 15,
    paddingTop: 20,
    height: '100%',
    width: '100%',
  },
  withArrow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 5,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 15,
  },
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 10,
    zIndex: 1,
  },
  scrollView: {
    backgroundColor: 'red',
  },
});
export default AudioSelectModal;
