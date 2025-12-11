import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  dualLanguageOptions,
  sourceStreamOptions,
  workShopOptions,
} from '../../../consts';
import logger from '../../../services/logger';
import BottomBarIconWithText from '../../../settings/BottomBarIconWithTextAnimated';
import { useShidurStore } from '../../../zustand/shidur';
import { useUiActions } from '../../../zustand/uiActions';
import { bottomBar } from '../../helper';
import AudioHeader from './AudioHeader';
import AudioOption from './AudioOption';
const NAMESPACE = 'AudioSelectModal';
const AudioSelectModal = () => {
  const { audio, setAudio } = useShidurStore();
  const { toggleShowBars } = useUiActions();
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const handleSetAudio = key => {
    logger.debug(NAMESPACE, 'handleSetAudio', key);
    setAudio(key);
    toggleShowBars(false, true);
    setVisible(false);
  };
  return (
    <View style={bottomBar.btn}>
      <Pressable onPress={() => setVisible(true)}>
        <BottomBarIconWithText
          iconName="record-voice-over"
          text={t(audio.text) + ' - ' + t(audio.description)}
          extraStyle={['rest', 'resticon']}
          showtext={true}
          direction={['vertical', 'vertical']}
        />
      </Pressable>
      <Modal
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        visible={visible}
        onRequestClose={() => setVisible(false)}
        supportedOrientations={['portrait', 'landscape']}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent} pointerEvents="auto">
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.close}
              >
                <Icon name="close" size={30} color="white" />
              </TouchableOpacity>
              <ScrollView>
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
        </TouchableWithoutFeedback>
      </Modal>
    </View>
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
  },
  modalContent: {
    width: '70%',
    maxHeight: '80%',
    backgroundColor: '#1c1c1c',
    borderRadius: 5,
    padding: 15,
    paddingTop: 20,
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
});
export default AudioSelectModal;
