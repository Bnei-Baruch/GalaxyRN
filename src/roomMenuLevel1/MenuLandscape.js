import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import { BottomBar } from '../roomMenuLevel0/BottomBar';
import { TopBar } from '../roomMenuLevel0/TopBar';
import { BroadcastMuteBtn } from './btns/BroadcastMuteBtn';
import { ChatBtn } from './btns/ChatBtn';
import { DonateBtn } from './btns/DonateBtn';
import { GroupsBtn } from './btns/GroupsBtn';
import { HideSelfBtn } from './btns/HideSelfBtn';
import { ShidurBtn } from './btns/ShidurBtn';
import { StudyMaterialsBtn } from './btns/StudyMaterialsBtn';
import { SubtitleBtn } from './btns/SubtitleBtn';
import { TranslationBtn } from './btns/TranslationBtn';
import VideoSelect from './btns/VideoSelect';
import { VoteBtn } from './btns/VoteBtn';
import AudioSelectBtn from './btns/audioSelect/AudioSelectBtn';
import { buttonsPaneStyles as styles } from './helper';

const MenuLandscape = ({ animatedBottomPanelStyle }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const paddingBottom = insets.bottom + 8;
  const paddingTop = insets.top + 8;
  const paddingLeft = insets.left + 8;
  const paddingRight = insets.right + 8;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom,
          paddingTop,
          paddingLeft,
          paddingRight,
        },
      ]}
    >
      <View style={styles.barContainer}>
        <TopBar />
      </View>
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
        <View style={styles.buttonsSectionsRow}>
          <View style={[styles.firstColumn]}>
            <View style={[styles.buttonsSection, styles.buttonsSectionLast]}>
              <Text style={[baseStyles.text, styles.text]} numberOfLines={1}>
                {t('bottomBar.show')}
              </Text>
              <View style={styles.buttonsBlock}>
                <View style={styles.buttonsRow}>
                  <View style={styles.button_100}>
                    <ShidurBtn />
                  </View>
                </View>
                <View style={styles.buttonsRow}>
                  <View style={styles.button_100}>
                    <GroupsBtn />
                  </View>
                </View>
                <View style={styles.buttonsRow}>
                  <View style={styles.button_100}>
                    <HideSelfBtn />
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.column]}>
            <View style={[styles.buttonsSection, styles.buttonsSectionLast]}>
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
          </View>
          <View style={[styles.lastColumn]}>
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
          </View>
        </View>
      </Animated.View>
      <View style={styles.barContainer}>
        <BottomBar />
      </View>
    </View>
  );
};

export default MenuLandscape;
