import { STUDY_MATERIALS_URL } from '@env';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import ScreenTitle from '../../components/ScreenTitle';
import { bottomBar } from '../../roomMenuLevel0/helper';
import BottomBarIconWithText from '../../settings/BottomBarIconWithText';

export const StudyMaterialsBtn = () => {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const toggleModal = () => setOpen(!open);

  return (
    <>
      <Pressable onPress={toggleModal} style={bottomBar.btn}>
        <BottomBarIconWithText
          iconName="book"
          text={t('moreOpts.materials')}
          extraStyle={['rest', 'rest_icon']}
          showtext={[true, false]}
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

          <WebView
            style={styles.item}
            source={{ uri: `${STUDY_MATERIALS_URL}?language=${i18n.language}` }}
          />
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
