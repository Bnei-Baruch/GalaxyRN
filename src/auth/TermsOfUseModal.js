import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const TermsOfUseModal = ({ visible, onClose }) => {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
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
