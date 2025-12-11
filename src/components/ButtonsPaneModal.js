import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomBar } from '../bottomBar/BottomBar';
import { AudioDevicesBtn } from '../bottomBar/moreBtns/AudioDevicesBtn';
import { BroadcastMuteBtn } from '../bottomBar/moreBtns/BroadcastMuteBtn';
import { ChatBtn } from '../bottomBar/moreBtns/ChatBtn';
import { DonateBtn } from '../bottomBar/moreBtns/DonateBtn';
import { GroupsBtn } from '../bottomBar/moreBtns/GroupsBtn';
import { HideSelfBtn } from '../bottomBar/moreBtns/HideSelfBtn';
import { LeaveBtn } from '../bottomBar/moreBtns/LeaveBtn';
import { ShidurBtn } from '../bottomBar/moreBtns/ShidurBtn';
import { StudyMaterialsBtn } from '../bottomBar/moreBtns/StudyMaterialsBtn';
import { SubtitleBtn } from '../bottomBar/moreBtns/SubtitleBtn';
import { TranslationBtn } from '../bottomBar/moreBtns/TranslationBtn';
import VideoSelect from '../bottomBar/moreBtns/VideoSelect';
import { VoteBtn } from '../bottomBar/moreBtns/VoteBtn';
import AudioSelectModal from '../bottomBar/moreBtns/audioSelect/AudioSelectModal';
import { baseStyles } from '../constants';
import { useRoomStore } from '../zustand/fetchRooms';
import { useInitsStore } from '../zustand/inits';
import { useUiActions } from '../zustand/uiActions';
import Text from './CustomText';

const PANEL_ANIMATION_IN = 200;
const PANEL_ANIMATION_OUT = 150;
const getTranslateYValue = styleRef => {
  const flattened = StyleSheet.flatten(styleRef);
  if (!flattened || !Array.isArray(flattened.transform)) {
    return 0;
  }
  const translateEntry = flattened.transform.find(
    entry => entry && Object.prototype.hasOwnProperty.call(entry, 'translateY')
  );
  if (!translateEntry) {
    return 0;
  }
  return normalizeTranslateValue(translateEntry.translateY);
};
const normalizeTranslateValue = value => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
      const percent = parseFloat(trimmed.slice(0, -1));
      if (!Number.isNaN(percent)) {
        return (percent / 100) * Dimensions.get('window').height;
      }
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric;
    }
  }
  return 0;
};
const ButtonsPaneModal = () => {
  const { room } = useRoomStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { toggleMoreModal, moreModal } = useUiActions();
  const { isPortrait } = useInitsStore();
  const [shouldRenderModal, setShouldRenderModal] = useState(moreModal);
  const modalVisible = moreModal || shouldRenderModal;
  const translateYStart = useMemo(
    () => getTranslateYValue(styles.panelWrapperTopStart),
    [isPortrait]
  );
  const translateYEnd = useMemo(
    () => getTranslateYValue(styles.panelWrapperTopEnd),
    [isPortrait]
  );
  const translateYBottomStart = useMemo(
    () => getTranslateYValue(styles.panelWrapperBottomStart),
    [isPortrait]
  );
  const translateYBottomEnd = useMemo(
    () => getTranslateYValue(styles.panelWrapperBottomEnd),
    [isPortrait]
  );
  const panelEntrance = useRef(new Animated.Value(0)).current;
  const animatedTopPanelStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: panelEntrance.interpolate({
            inputRange: [0, 1],
            outputRange: [translateYStart, translateYEnd],
            extrapolate: 'clamp',
          }),
        },
      ],
    }),
    [panelEntrance, translateYStart, translateYEnd]
  );
  const animatedBottomPanelStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: panelEntrance.interpolate({
            inputRange: [0, 1],
            outputRange: [translateYBottomStart, translateYBottomEnd],
            extrapolate: 'clamp',
          }),
        },
      ],
    }),
    [panelEntrance, translateYBottomStart, translateYBottomEnd]
  );
  useEffect(() => {
    if (!moreModal) {
      return;
    }
    setShouldRenderModal(true);
    panelEntrance.stopAnimation();
    const animation = Animated.timing(panelEntrance, {
      toValue: 1,
      duration: PANEL_ANIMATION_IN,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => {
      animation.stop();
    };
  }, [moreModal, panelEntrance]);
  useEffect(() => {
    if (moreModal || !shouldRenderModal) {
      return;
    }
    panelEntrance.stopAnimation();
    let isCancelled = false;
    const animation = Animated.timing(panelEntrance, {
      toValue: 0,
      duration: PANEL_ANIMATION_OUT,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !isCancelled) {
        setShouldRenderModal(false);
      }
    });
    return () => {
      isCancelled = true;
      animation.stop();
    };
  }, [moreModal, panelEntrance, shouldRenderModal]);
  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleMoreModal}
        supportedOrientations={['portrait', 'landscape']}
      >
        <TouchableWithoutFeedback onPress={toggleMoreModal}>
          <View
            style={[
              styles.modalContainer,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 80 + 16,
                paddingTop: insets.top + 8,
              },
              !isPortrait && styles.modalContainerLandscape,
            ]}
          >
            <BottomBar />
            {/* for Portrait orientation */}
            {isPortrait && (
              <>
                <Animated.View
                  style={[
                    styles.panelWrapper,
                    baseStyles.panelBackground,
                    styles.panelWrapperTop,
                    styles.panelWrapperTopEnd,
                    animatedTopPanelStyle,
                    {
                      marginLeft: insets.left + 8,
                      marginRight: insets.right + 8,
                    },
                  ]}
                >
                  <View
                    style={[styles.buttonsSection, styles.buttonsSectionLast]}
                  >
                    <Text
                      style={[baseStyles.text, styles.text]}
                      numberOfLines={1}
                    >
                      {t('bottomBar.roomSettings')} - {room?.description}
                    </Text>
                    <View style={styles.buttonsBlock}>
                      <View style={styles.buttonsRow}>
                        <View style={styles.button_50}>
                          <AudioDevicesBtn />
                        </View>
                        <View style={styles.button_50}>
                          <LeaveBtn />
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
                <Animated.View
                  style={[
                    styles.panelWrapper,
                    styles.panelWrapperBottom,
                    baseStyles.panelBackground,
                    styles.panelWrapperBottomEnd,
                    animatedBottomPanelStyle,
                    {
                      marginLeft: insets.left + 8,
                      marginRight: insets.right + 8,
                    },
                  ]}
                >
                  <View style={styles.buttonsSection}>
                    <Text
                      style={[baseStyles.text, styles.text]}
                      numberOfLines={1}
                    >
                      {t('bottomBar.show')}
                    </Text>
                    <View style={styles.buttonsBlock}>
                      <View style={styles.buttonsRow}>
                        <View style={styles.button_33}>
                          <ShidurBtn />
                        </View>
                        <View style={styles.button_33}>
                          <GroupsBtn />
                        </View>
                        <View style={styles.button_33}>
                          <HideSelfBtn />
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.buttonsSection}>
                    <Text
                      style={[baseStyles.text, styles.text]}
                      numberOfLines={1}
                    >
                      {t('bottomBar.broadcastsettings')}
                    </Text>
                    <View style={styles.buttonsBlock}>
                      <View style={styles.buttonsRow}>
                        <View style={styles.button_33}>
                          <TranslationBtn />
                        </View>
                        <View style={styles.button_33}>
                          <SubtitleBtn />
                        </View>
                        <View style={styles.button_33}>
                          <BroadcastMuteBtn />
                        </View>
                      </View>
                      <View style={styles.buttonsRow}>
                        <View style={styles.button_50}>
                          <VideoSelect />
                        </View>
                        <View style={styles.button_50}>
                          <AudioSelectModal />
                        </View>
                      </View>
                    </View>
                  </View>
                  <View
                    style={[styles.buttonsSection, styles.buttonsSectionLast]}
                  >
                    <Text
                      style={[baseStyles.text, styles.text]}
                      numberOfLines={1}
                    >
                      {t('bottomBar.open')}
                    </Text>
                    <View style={styles.buttonsBlock}>
                      <View style={styles.buttonsRow}>
                        <View style={styles.button_50}>
                          <ChatBtn />
                        </View>
                        <View style={styles.button_50}>
                          <VoteBtn />
                        </View>
                      </View>
                      <View style={styles.buttonsRow}>
                        <View style={styles.button_50}>
                          <StudyMaterialsBtn />
                        </View>
                        <View style={styles.button_50}>
                          <DonateBtn />
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              </>
            )}
            {/* for Landscape orientation */}
            {!isPortrait && (
              <Animated.View
                style={[
                  styles.panelWrapper,
                  styles.panelWrapperBottom,
                  baseStyles.panelBackground,
                  styles.panelWrapperBottomEnd,
                  animatedBottomPanelStyle,
                  {
                    marginLeft: insets.left + 8,
                    marginRight: insets.right + 8,
                  },
                ]}
              >
                <View style={styles.buttonsSectionsRow}>
                  <View style={[styles.firstColumn]}>
                    <View style={[styles.buttonsSection]}>
                      <Text
                        style={[baseStyles.text, styles.text]}
                        numberOfLines={1}
                      >
                        {t('bottomBar.show')}
                      </Text>
                      <View style={styles.buttonsBlock}>
                        <View style={styles.buttonsRow}>
                          <View style={styles.button_33}>
                            <ShidurBtn />
                          </View>
                          <View style={styles.button_33}>
                            <GroupsBtn />
                          </View>
                          <View style={styles.button_33}>
                            <HideSelfBtn />
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={[styles.buttonsSection, styles.buttonsSectionLast]}
                    >
                      <Text
                        style={[baseStyles.text, styles.text]}
                        numberOfLines={1}
                      >
                        {t('bottomBar.open')}
                      </Text>
                      <View style={styles.buttonsBlock}>
                        <View style={styles.buttonsRow}>
                          <View style={styles.button_50}>
                            <ChatBtn />
                          </View>
                          <View style={styles.button_50}>
                            <VoteBtn />
                          </View>
                        </View>
                        <View style={styles.buttonsRow}>
                          <View style={styles.button_50}>
                            <StudyMaterialsBtn />
                          </View>
                          <View style={styles.button_50}>
                            <DonateBtn />
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.lastColumn]}>
                    <View style={[styles.buttonsSection]}>
                      <Text
                        style={[baseStyles.text, styles.text]}
                        numberOfLines={1}
                      >
                        {t('bottomBar.roomSettings')} - {room?.description}
                      </Text>
                      <View style={styles.buttonsBlock}>
                        <View style={styles.buttonsRow}>
                          <View style={styles.button_50}>
                            <AudioDevicesBtn />
                          </View>
                          <View style={styles.button_50}>
                            <LeaveBtn />
                          </View>
                        </View>
                      </View>
                    </View>
                    <View
                      style={[styles.buttonsSection, styles.buttonsSectionLast]}
                    >
                      <Text
                        style={[baseStyles.text, styles.text]}
                        numberOfLines={1}
                      >
                        {t('bottomBar.broadcastsettings')}
                      </Text>
                      <View style={styles.buttonsBlock}>
                        <View style={styles.buttonsRow}>
                          <View style={styles.button_33}>
                            <TranslationBtn />
                          </View>
                          <View style={styles.button_33}>
                            <SubtitleBtn />
                          </View>
                          <View style={styles.button_33}>
                            <BroadcastMuteBtn />
                          </View>
                        </View>
                        <View style={styles.buttonsRow}>
                          <View style={styles.button_50}>
                            <VideoSelect />
                          </View>
                          <View style={styles.button_50}>
                            <AudioSelectModal />
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainerLandscape: {
    justifyContent: 'flex-end',
  },
  panelWrapper: {
    borderRadius: 32,
    padding: 16,
  },
  panelWrapperLandscape: {},
  panelWrapperTop: {
    position: 'relative',
  },
  panelWrapperBottom: {},
  panelWrapperTopStart: {
    transform: [{ translateY: '-50%' }],
  },
  panelWrapperTopEnd: {
    transform: [{ translateY: 0 }],
  },
  panelWrapperBottomStart: {
    transform: [{ translateY: '100%' }],
  },
  panelWrapperBottomEnd: {
    transform: [{ translateY: 0 }],
  },
  buttonsSection: {
    marginBottom: 24,
    flexShrink: 1,
  },
  buttonsSectionsRow: {
    flexDirection: 'row',
    justifyContent: 'stretch',
    display: 'flex',
  },
  columnsSpacer: {
    width: 24,
  },
  firstColumn: {
    width: '50%',
    paddingRight: 12,
  },
  lastColumn: {
    width: '50%',
    paddingLeft: 12,
  },
  buttonsSectionLast: {
    marginBottom: 0,
  },
  buttonsBlock: {},
  buttonsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginTop: 8,
  },
  button_50: {
    width: '50%',
  },
  button_33: {
    width: '33.3333333%',
  },
  button_25: {
    width: '25%',
  },
  text: {
    marginLeft: 8,
    color: '#7f7f7f',
  },
  tooltip: {
    width: '70%',
    maxHeight: Dimensions.get('window').height * 0.8,
    bottom: 0,
    borderRadius: 5,
    elevation: 5,
    shadowColor: '#FFF',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    alignSelf: 'center',
    backgroundColor: '#1c1c1c',
    color: 'white',
    paddingTop: 15,
  },
  selected: {
    backgroundColor: '#222222',
  },
  close: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
});
export default ButtonsPaneModal;
