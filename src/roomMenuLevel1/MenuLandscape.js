import React from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/CustomText';
import { baseStyles } from '../constants';
import { BottomBar } from '../roomMenuLevel0/BottomBar';
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
  const marginnLeft = insets.left;
  const marginnRight = insets.right;
  const marginTop = insets.top;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.panelWrapper,
          baseStyles.panelBackground,
          animatedBottomPanelStyle,
          {
            marginLeft: marginnLeft,
            marginRight: marginnRight,
            marginTop: marginTop,
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
                  <View style={styles.button_50}>
                    <ShidurBtn />
                  </View>
                  <View style={styles.button_50}>
                    <HideSelfBtn />
                  </View>
                </View>
                <View style={styles.buttonsRow}>
                  <View style={styles.button_100}>
                    <GroupsBtn />
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
                  <View>
                    <ChatBtn />
                  </View>
                  <View>
                    <VoteBtn />
                  </View>
                </View>
                <View style={styles.buttonsRow}>
                  <View>
                    <StudyMaterialsBtn />
                  </View>
                  <View>
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
