import React from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ChatBtn } from '../bottomBar/moreBtns/ChatBtn';
import { DonateBtn } from '../bottomBar/moreBtns/DonateBtn';
import { StudyMaterialsBtn } from '../bottomBar/moreBtns/StudyMaterialsBtn';
import { VoteBtn } from '../bottomBar/moreBtns/VoteBtn';
import Text from './CustomText';

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomBar } from '../bottomBar/BottomBar';
import { GroupsBtn } from '../bottomBar/moreBtns/GroupsBtn';
import { HideSelfBtn } from '../bottomBar/moreBtns/HideSelfBtn';
import { ShidurBtn } from '../bottomBar/moreBtns/ShidurBtn';
import { baseStyles } from '../constants';
import { useInitsStore } from '../zustand/inits';
import { useUiActions } from '../zustand/uiActions';

const ButtonsPaneModal = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { toggleMoreModal, moreModal } = useUiActions();
  const { isPortrait } = useInitsStore();

  return (
    <View style={styles.container}>
      <Modal
        presentationStyle="overFullScreen"
        transparent={true}
        visible={moreModal}
        onRequestClose={toggleMoreModal}
        supportedOrientations={['portrait', 'landscape']}
      >
        <TouchableWithoutFeedback onPress={toggleMoreModal}>
          <View style={styles.modalContainer}>
            <BottomBar />
            <View
              style={[
                styles.paneWrapper,
                baseStyles.panelBackground,
                {
                  marginLeft: insets.left + 8,
                  marginRight: insets.right + 8,
                },
                !isPortrait && styles.paneWrapperLandscape,
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
                  {t('bottomBar.open')}
                </Text>

                {/* for portrait mode only */}
                {isPortrait && (
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
                )}
                {/* for landscape mode only */}
                {!isPortrait && (
                  <View style={styles.buttonsBlock}>
                    <View style={styles.buttonsRow}>
                      <View style={styles.button_25}>
                        <ChatBtn />
                      </View>
                      <View style={styles.button_25}>
                        <VoteBtn />
                      </View>
                      <View style={styles.button_25}>
                        <StudyMaterialsBtn />
                      </View>
                      <View style={styles.button_25}>
                        <DonateBtn />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingBottom: 80 + 16 + 16, // BottomBar height + marginBottom + extra
  },
  paneWrapper: {
    // padding: 16,
    // marginHorizontal: 8,
    borderRadius: 32,
    // marginTop:-32
    // paddingBottom: 0
  },
  paneWrapperLandscape: {
    // borderWidth: 10,
    // borderColor: 'red',
  },
  buttonsSection: {
    // marginVertical: 16,
    padding: 16,
    // marginTop:32
  },
  buttonsBlock: {
    marginBottom: -8,
    marginHorizontal: -4,
  },
  buttonsRow: {
    // display: 'flex',
    flexDirection: 'row',
    marginBottom: 8,
    // backgroundColor:'yellow',
    // padding:0,
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
    marginBottom: 8,
    marginLeft: 8,
    color: '#575757',
  },
  // flexDirection: 'column',
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
