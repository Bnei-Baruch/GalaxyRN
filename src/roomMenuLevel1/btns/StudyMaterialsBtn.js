import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import ScreenTitle from '../../components/ScreenTitle';
import WIP from '../../components/WIP';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';
import { useMaterials } from '../../zustand/fetchMaterials';
import { bottomBar } from '../../roomMenuLevel0/helper';
import { StudyMaterialItem } from './StudyMaterialItem';

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
          text={t('moreOpts.materials')}
          extraStyle={['rest', 'resticon']}
          showtext={[ true, false ]}
          direction={['horizontal', 'horizontal']}
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
          <ScreenTitle text={t('moreOpts.materials')} close={toggleModal} />
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
