import * as React from 'react';
import { useState } from 'react';
import { TouchableOpacity, Text, Modal, View, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { topMenuBtns } from './helper';
import useMaterials from '../zustand/fetchMaterials';
import WIP from '../components/WIP';
import { useTranslation } from 'react-i18next';
import { StudyMaterialItem } from './StudyMaterialItem';
import ScreenTitle from '../components/ScreenTitle';

export const StudyMaterialsBtn = () => {
  const [open, setOpen]                          = useState(false);
  const { fetchMaterials, materials, isLoading } = useMaterials();
  const { t }                                    = useTranslation();

  const toggleModal = () => {
    if (!open)
      fetchMaterials();
    setOpen(!open);
  };

  return (
    <>
      <TouchableOpacity onPress={toggleModal} style={topMenuBtns.btn}>
        <Icon name="library-books" size={30} color="white" />
        <Text style={topMenuBtns.menuItemText}>
          {t('topBar.materials')}
        </Text>
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={false}
        visible={open}
        onRequestClose={toggleModal}
      >
        <ScreenTitle text={t('topBar.materialsTitle')} close={toggleModal} />
        <WIP isReady={!isLoading}>
          <ScrollView>
            <View>
              {
                materials.map(m => <StudyMaterialItem msg={m} key={m.Title} />)
              }
            </View>
          </ScrollView>
        </WIP>
      </Modal>
    </>
  );
};
