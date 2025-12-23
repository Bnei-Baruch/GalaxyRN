import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../../components/CustomText';
import { baseStyles } from '../../constants';
import { useRoomStore } from '../../zustand/fetchRooms';
import { BottomBarBtns } from '../BottomBarBtns';
import { AudioDevicesBtn } from '../moreBtns/AudioDevicesBtn';
import { BroadcastMuteBtn } from '../moreBtns/BroadcastMuteBtn';
import { ChatBtn } from '../moreBtns/ChatBtn';
import { DonateBtn } from '../moreBtns/DonateBtn';
import { GroupsBtn } from '../moreBtns/GroupsBtn';
import { HideSelfBtn } from '../moreBtns/HideSelfBtn';
import { LeaveBtn } from '../moreBtns/LeaveBtn';
import { ShidurBtn } from '../moreBtns/ShidurBtn';
import { StudyMaterialsBtn } from '../moreBtns/StudyMaterialsBtn';
import { SubtitleBtn } from '../moreBtns/SubtitleBtn';
import { TranslationBtn } from '../moreBtns/TranslationBtn';
import VideoSelect from '../moreBtns/VideoSelect';
import { VoteBtn } from '../moreBtns/VoteBtn';
import AudioSelectBtn from '../moreBtns/audioSelect/AudioSelectBtn';
import { buttonsPaneStyles as styles } from './helper';

const ButtonsPanePortrait = ({
  animatedTopPanelStyle,
  animatedBottomPanelStyle,
}) => {
  const { room } = useRoomStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const paddingBottom = Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 8;
  const paddingTop = Platform.OS === 'ios' ? insets.top + 8 : 8;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom,
          paddingTop,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.panelWrapper,
          baseStyles.panelBackground,
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
          baseStyles.panelBackground,
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
      <View style={styles.bottomBarContainer}>
        <BottomBarBtns />
      </View>
    </View>
  );
};

export default ButtonsPanePortrait;
