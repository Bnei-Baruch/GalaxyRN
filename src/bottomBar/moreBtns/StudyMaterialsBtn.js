import * as React from 'react';
import { useState } from 'react';
import {
  Text,
  Modal,
  View,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { topMenuBtns } from '../../topBar/helper';
import useMaterials from '../../zustand/fetchMaterials';
import WIP from '../../components/WIP';
import { StudyMaterialItem } from '../../topBar/StudyMaterialItem';
import ScreenTitle from '../../components/ScreenTitle';
import { bottomBar } from '../helper';

export const StudyMaterialsBtn = () => {
  const [open, setOpen] = useState(false);
  const { fetchMaterials, materials, isLoading } = useMaterials();
  const { t } = useTranslation();

  const toggleModal = () => {
    if (!open) fetchMaterials();
    setOpen(!open);
  };

  return (
    <>
      <Pressable onPress={toggleModal} style={bottomBar.btn}>
        <BottomBarIconWithText
          iconName="book"
          text={t('topBar.materials')}
          extraStyle={['rest', 'resticon']}
          showtext={true}
          direction="horizontal"
        />
      </Pressable>
      <Modal
        visible={open}
        onRequestClose={toggleModal}
        style={styles.modal}
        animationType="none"
        presentationStyle="pageSheet"
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={styles.modal}>
          <ScreenTitle text={t('topBar.materialsTitle')} close={toggleModal} />
          <WIP isReady={!isLoading}>
            <ScrollView>
              {materials.map(m => (
                <StudyMaterialItem msg={m} key={m.Title} />
              ))}
            </ScrollView>
          </WIP>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'black',
    flex: 1,
  },
});
