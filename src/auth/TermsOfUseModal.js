import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/CustomText';

const TermsOfUseModal = ({ visible, onClose }) => {
  const { t } = useTranslation();
  if (!visible) {
    return null;
  }
  return (
    <View style={styles.centeredView}>
      <View style={styles.modalView}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.modalText}>
            {t('loginPage.termsOfUseContent')}
          </Text>
        </ScrollView>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>{t('close')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'green',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    height: '80%',
    width: '90%',
    paddingBottom: 20,
    paddingTop: 20,
    backgroundColor: '#1c1c1c',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
    width: '100%',
    height: '100%',
  },
  modalText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'left',
  },
  closeButton: {
    backgroundColor: '#0066CC',
    borderRadius: 20,
    padding: 10,
    width: 150,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default TermsOfUseModal;
