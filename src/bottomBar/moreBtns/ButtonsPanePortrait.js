import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../../components/CustomText';
import { baseStyles } from '../../constants';
import { useRoomStore } from '../../zustand/fetchRooms';
import { AudioDevicesBtn } from './AudioDevicesBtn';
import { BroadcastMuteBtn } from './BroadcastMuteBtn';
import { ChatBtn } from './ChatBtn';
import { DonateBtn } from './DonateBtn';
import { GroupsBtn } from './GroupsBtn';
import { HideSelfBtn } from './HideSelfBtn';
import { LeaveBtn } from './LeaveBtn';
import { ShidurBtn } from './ShidurBtn';
import { StudyMaterialsBtn } from './StudyMaterialsBtn';
import { SubtitleBtn } from './SubtitleBtn';
import { TranslationBtn } from './TranslationBtn';
import VideoSelect from './VideoSelect';
import { VoteBtn } from './VoteBtn';
import AudioSelectBtn from './audioSelect/AudioSelectBtn';

const ButtonsPanePortrait = ({
  bottomBarBtns,
  animatedTopPanelStyle,
  animatedBottomPanelStyle,
}) => {
  const { room } = useRoomStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container]}>
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
        <View style={[styles.buttonsSection, styles.buttonsSectionLast]}>
          <Text style={[baseStyles.text, styles.text]} numberOfLines={1}>
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
          <Text style={[baseStyles.text, styles.text]} numberOfLines={1}>
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
          <Text style={[baseStyles.text, styles.text]} numberOfLines={1}>
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
                <AudioSelectBtn />
              </View>
            </View>
          </View>
        </View>
        <View style={[styles.buttonsSection, styles.buttonsSectionLast]}>
          <Text style={[baseStyles.text, styles.text]} numberOfLines={1}>
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
      <View
        style={{
          marginLeft: insets.left + 8,
          marginRight: insets.right + 8,
          marpaginBottom: insets.bottom + 80,
        }}
      >
        {bottomBarBtns}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
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
});
export default ButtonsPanePortrait;
