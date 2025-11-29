import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Text from './CustomText';
import { ChatBtn } from '../bottomBar/moreBtns/ChatBtn';
import { VoteBtn } from '../bottomBar/moreBtns/VoteBtn';
import { DonateBtn } from '../bottomBar/moreBtns/DonateBtn';
import { StudyMaterialsBtn } from '../bottomBar/moreBtns/StudyMaterialsBtn';

import { GroupsBtn } from '../bottomBar/moreBtns/GroupsBtn';
import { HideSelfBtn } from '../bottomBar/moreBtns/HideSelfBtn';
import { ShidurBtn } from '../bottomBar/moreBtns/ShidurBtn';
import { BottomBar } from '../bottomBar/BottomBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { baseStyles } from '../constants';
export const ButtonsPaneModalContext = React.createContext(null);
export const useButtonsPaneModal = () =>
  React.useContext(ButtonsPaneModalContext);

const ButtonsPaneModal = ({
  items,
  selected,
  onSelect,
  onOpen,
  renderItem,
  open = false,
  trigger,
}) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [visible, setVisible] = useState(open);
  const tooltipRef = useRef(null);

  const toggleModal = React.useCallback(() => {
    setVisible(prev => {
      const next = !prev;
      onOpen && onOpen(next);
      return next;
    });
  }, [onOpen]);

  const closeModal = React.useCallback(() => {
    setVisible(prev => {
      if (!prev) return prev;
      onOpen && onOpen(false);
      return false;
    });
  }, [onOpen]);

  const contextValue = useMemo(() => ({ closeModal }), [closeModal]);

  const handleSelect = item => {
    onSelect && onSelect(item);
    toggleModal();
  };

  const _renderItem = item => {
    const key = item.key ?? item.value ?? item.text ?? item.id;
    if (!key) return;

    return (
      <View key={key} style={styles.item}>
        <TouchableOpacity
          onPress={() => handleSelect(item)}
          style={[
            styles.item,
            selected && item.value === selected && styles.selected,
          ]}
        >
          {renderItem(item)}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Pressable ref={tooltipRef} onPress={toggleModal}>
        {trigger ? trigger : <Text styles={styles.itemText}>{selected}</Text>}
      </Pressable>
      <Modal
        // animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        visible={visible}
        onRequestClose={toggleModal}
        supportedOrientations={['portrait', 'landscape']}
      >
        <ButtonsPaneModalContext.Provider value={contextValue}>
          <TouchableWithoutFeedback onPress={toggleModal}>
            <View style={styles.modalContainer}>
              <BottomBar />

              <View
                style={[
                  styles.paneWrapper,
                  baseStyles.panelBackground,
                  { marginLeft: insets.left + 8, marginRight: insets.right + 8 },
                  isLandscape && styles.paneWrapperLandscape,
                ]}
              >
                <View style={styles.buttonsSection}>
                  <Text
                    style={[ baseStyles.text, styles.text]}
                    numberOfLines={1}
                  >
                    Show
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
                    style={[ baseStyles.text, styles.text]}
                    numberOfLines={1}
                  >
                    Open
                  </Text>

                  {/* for portrait mode only */}
                  {!isLandscape && (
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
                  {isLandscape && (
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
        </ButtonsPaneModalContext.Provider>
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
    marginLeft:8,
    color:'#575757',
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
